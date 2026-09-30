import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Location, Service, Counter } from '../../../shared/schemas';
import { useNotification } from '../context/NotificationContext';
import { LoadingSpinner, EmptyState } from '../components/Common';
import {
  Sparkles,
  Plus,
  Power,
  ChevronRight,
  X,
  UserCheck,
  CheckCircle,
} from 'lucide-react';

export const AdminCountersPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [counters, setCounters] = useState<Counter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [counterName, setCounterName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotification();

  // Load locations first
  useEffect(() => {
    async function init() {
      try {
        const locs = await api.locations.list();
        setLocations(locs);
        if (locs.length > 0) {
          setSelectedLocationId(locs[0].id);
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Load services when location changes
  useEffect(() => {
    async function loadServices() {
      if (!selectedLocationId) return;
      try {
        const srvs = await api.services.getByLocation(selectedLocationId);
        setServices(srvs);
        if (srvs.length > 0) {
          setSelectedServiceId(srvs[0].id);
        } else {
          setSelectedServiceId('');
          setCounters([]);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      }
    }
    loadServices();
  }, [selectedLocationId]);

  // Load counters when service changes
  const loadCounters = async () => {
    if (!selectedServiceId) return;
    try {
      const data = await api.counters.getByService(selectedServiceId);
      setCounters(data);
    } catch (err) {
      console.error('Failed to load counters:', err);
    }
  };

  useEffect(() => {
    loadCounters();
  }, [selectedServiceId]);

  const handleToggleOpen = async (counter: Counter) => {
    try {
      const updated = await api.counters.update(counter.id, {
        is_open: !counter.is_open,
      });
      setCounters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast({
        type: updated.is_open ? 'success' : 'info',
        title: updated.is_open ? 'Counter Opened' : 'Counter Closed',
        message: `${counter.name} is now ${updated.is_open ? 'open' : 'closed'}.`,
      });
    } catch (err: any) {
      showToast({ type: 'warning', title: 'Error', message: err.message });
    }
  };

  const handleCreateCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !counterName.trim()) return;

    setIsSubmitting(true);
    try {
      await api.counters.create({
        service_id: selectedServiceId,
        name: counterName.trim(),
        is_open: true,
      });
      showToast({
        type: 'success',
        title: 'Counter Added',
        message: `${counterName} registered successfully.`,
      });
      setCounterName('');
      setModalOpen(false);
      loadCounters();
    } catch (err: any) {
      showToast({ type: 'warning', title: 'Error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/admin" className="hover:text-white">Admin</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-medium">Counters</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Service Desks & Counters</h1>
          <p className="text-xs text-slate-400">
            Open or close individual windows and assign desk operators.
          </p>
        </div>

        <button
          onClick={() => {
            setCounterName('');
            setModalOpen(true);
          }}
          disabled={!selectedServiceId}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
          <span>Add Window Counter</span>
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Facility
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Service
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Counters Table */}
      {isLoading ? (
        <LoadingSpinner message="Loading counters..." />
      ) : counters.length > 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Counter / Window Name</th>
                  <th className="px-5 py-3.5">Assigned Operator</th>
                  <th className="px-5 py-3.5">Serving Token</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Toggle State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {counters.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white">{c.name}</td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {c.operator_name ? (
                        <span className="flex items-center gap-1.5 text-indigo-300">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{c.operator_name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned (Pool)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.currently_serving_token ? (
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {c.currently_serving_token.token_number}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          c.is_open
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 glow-emerald'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {c.is_open ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleOpen(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto ${
                          c.is_open
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{c.is_open ? 'Close Counter' : 'Open Counter'}</span>
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
          title="No Counters Configured"
          description="Create a window counter for this service to allow operators to call tokens."
          actionText="Add Counter"
          onAction={() => setModalOpen(true)}
        />
      )}

      {/* Modal: Create Counter */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 max-w-sm w-full relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Add Window Counter</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCounter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Counter Name *
                </label>
                <input
                  type="text"
                  required
                  value={counterName}
                  onChange={(e) => setCounterName(e.target.value)}
                  placeholder="e.g. Window 3 - Express"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Counter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
