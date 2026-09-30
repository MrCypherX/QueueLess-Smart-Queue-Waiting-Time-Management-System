import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Counter, Token, Service } from '../../../shared/schemas';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { LoadingSpinner, EmptyState } from '../components/Common';
import {
  LayoutDashboard,
  Volume2,
  CheckCircle,
  SkipForward,
  Play,
  Clock,
  User,
  Phone,
  FileText,
  AlertCircle,
  Layers,
  ArrowRight,
  Power,
  RotateCcw,
} from 'lucide-react';

export const OperatorConsolePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [counters, setCounters] = useState<Counter[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  const [currentCounter, setCurrentCounter] = useState<Counter | null>(null);

  const [queueData, setQueueData] = useState<{
    service: Service | null;
    serving: Token[];
    waiting: Token[];
    completedToday: Token[];
  }>({
    service: null,
    serving: [],
    waiting: [],
    completedToday: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Load operator assigned counters
  const loadCounters = async () => {
    try {
      const data = await api.counters.my();
      setCounters(data);
      if (data.length > 0 && !selectedCounterId) {
        setSelectedCounterId(data[0].id);
        setCurrentCounter(data[0]);
      }
    } catch (err) {
      console.error('Failed to load counters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCounters();
  }, []);

  // Fetch queue data for the selected counter's service
  const loadQueue = async () => {
    if (!currentCounter?.service_id) return;
    try {
      const q = await api.tokens.getQueue(currentCounter.service_id);
      setQueueData(q);
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  };

  useEffect(() => {
    if (selectedCounterId && counters.length > 0) {
      const found = counters.find((c) => c.id === selectedCounterId);
      if (found) {
        setCurrentCounter(found);
      }
    }
  }, [selectedCounterId, counters]);

  useEffect(() => {
    if (currentCounter) {
      loadQueue();
    }
  }, [currentCounter?.service_id]);

  // Connect to SSE for real-time queue updates on this service
  useEffect(() => {
    if (!currentCounter?.service_id) return;

    const eventSource = new EventSource(`/api/events/queue/${currentCounter.service_id}`);

    eventSource.addEventListener('queue_update', (e) => {
      try {
        loadQueue();
      } catch (err) {
        console.error('SSE queue update error:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [currentCounter?.service_id]);

  // Find currently active serving token for this specific counter
  const activeToken =
    queueData.serving.find(
      (t) => t.counter_id === currentCounter?.id || t.status === 'called' || t.status === 'serving'
    ) || null;

  // Serving elapsed timer
  useEffect(() => {
    if (!activeToken || activeToken.status === 'completed') {
      setElapsedSeconds(0);
      return;
    }

    const startTime = activeToken.called_at
      ? new Date(activeToken.called_at).getTime()
      : Date.now();
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeToken?.id, activeToken?.called_at]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Actions
  const handleToggleCounter = async () => {
    if (!currentCounter) return;
    try {
      const updated = await api.counters.update(currentCounter.id, {
        is_open: !currentCounter.is_open,
      });
      setCurrentCounter(updated);
      setCounters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast({
        type: updated.is_open ? 'success' : 'info',
        title: updated.is_open ? 'Counter Opened' : 'Counter Closed',
        message: `${updated.name} status updated.`,
      });
    } catch (err: any) {
      showToast({ type: 'warning', title: 'Error', message: err.message });
    }
  };

  const handleCallNext = async () => {
    if (!currentCounter) return;
    setIsCallingNext(true);
    try {
      const nextToken = await api.tokens.callNext(currentCounter.service_id, currentCounter.id);
      if (!nextToken) {
        showToast({
          type: 'info',
          title: 'Queue Empty',
          message: 'No citizens waiting in line for this service.',
        });
        return;
      }
      showToast({
        type: 'alert',
        title: `Called Token: ${nextToken.token_number}`,
        message: `${nextToken.citizen_name} called to ${currentCounter.name}.`,
      });
      await loadQueue();
    } catch (err: any) {
      showToast({ type: 'warning', title: 'Call Failed', message: err.message });
    } finally {
      setIsCallingNext(false);
    }
  };

  const handleUpdateStatus = async (tokenId: string, status: any) => {
    try {
      await api.tokens.updateStatus(tokenId, status, currentCounter?.id);
      showToast({
        type: 'success',
        title: `Token Marked as ${status.toUpperCase()}`,
        message: 'Queue updated successfully.',
      });
      await loadQueue();
    } catch (err: any) {
      showToast({ type: 'warning', title: 'Status Update Failed', message: err.message });
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Opening operator console..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Console Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Desk Operator Console
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              Station Ready
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Desk Officer: <strong>{user?.full_name}</strong> · Service:{' '}
            <strong>{currentCounter?.service_name || 'Loading...'}</strong>
          </p>
        </div>

        {/* Counter selector and Open/Close switch */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCounterId}
            onChange={(e) => setSelectedCounterId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            {counters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.service_name})
              </option>
            ))}
          </select>

          {currentCounter && (
            <button
              onClick={handleToggleCounter}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                currentCounter.is_open
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 glow-emerald'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{currentCounter.is_open ? 'Counter Open' : 'Counter Closed'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Operator Stage: Active Serving Card + Call Next Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Serving Token */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 glow-indigo relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Currently at Window
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-mono">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Elapsed: {formatTimer(elapsedSeconds)}</span>
              </div>
            </div>

            {activeToken ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                      Citizen Token
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-black text-white font-mono tracking-wider">
                      {activeToken.token_number}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border self-start ${
                      activeToken.status === 'called'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {activeToken.status === 'called' ? 'Called (Awaiting)' : 'In Consultation'}
                  </span>
                </div>

                {/* Citizen Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>
                      Name: <strong>{activeToken.citizen_name}</strong>
                    </span>
                  </div>
                  {activeToken.citizen_phone && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      <span>{activeToken.citizen_phone}</span>
                    </div>
                  )}
                  {activeToken.notes && (
                    <div className="col-span-full flex items-start gap-2 text-slate-300 pt-1 border-t border-slate-800">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>Note: {activeToken.notes}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  {activeToken.status === 'called' && (
                    <button
                      onClick={() => handleUpdateStatus(activeToken.id, 'serving')}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      <span>Citizen Arrived · Start Serving</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(activeToken.id, 'completed')}
                    className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Service Completed</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(activeToken.id, 'skipped')}
                    className="py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Skip / Absent</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <Volume2 className="w-12 h-12 text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-white">No Citizen Being Served</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Press "Call Next Token" when you are ready to attend to the next person.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Average service target: {queueData.service?.average_service_time_minutes || 8} min</span>
            <span>Completed today: {queueData.completedToday.length}</span>
          </div>
        </div>

        {/* Right 1 Col: Call Next Prominent Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Queue Status
            </span>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
              <p className="text-3xl font-black text-white">{queueData.waiting.length}</p>
              <p className="text-xs text-slate-400">Citizens Waiting in Line</p>
            </div>

            <button
              onClick={handleCallNext}
              disabled={isCallingNext || queueData.waiting.length === 0}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Volume2 className="w-5 h-5 animate-pulse" />
              <span>{isCallingNext ? 'Calling...' : 'Call Next Token'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Queue Discipline</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When you call the next token, QueueLess sends an instant push notification to the citizen and advances all remaining positions.
            </p>
          </div>
        </div>
      </div>

      {/* Waiting Queue Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Waiting Tokens ({queueData.waiting.length})</span>
          </h2>
        </div>

        {queueData.waiting.length > 0 ? (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Position</th>
                    <th className="px-5 py-3.5">Token</th>
                    <th className="px-5 py-3.5">Citizen Name</th>
                    <th className="px-5 py-3.5">Est. Wait</th>
                    <th className="px-5 py-3.5">Notes</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {queueData.waiting.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-cyan-400">
                        #{t.position_in_queue}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-white">
                        {t.token_number}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-200">
                        {t.citizen_name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        ~{t.estimated_wait_minutes} min
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 truncate max-w-xs">
                        {t.notes || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'called')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors"
                        >
                          Call Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Queue is Clear"
            description="There are currently no citizens waiting in line for this service."
          />
        )}
      </div>
    </div>
  );
};
