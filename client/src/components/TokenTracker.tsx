import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Token, TokenStatus } from '../../../shared/schemas';
import {
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Share2,
  Bell,
  RefreshCw,
  MapPin,
  Building,
  Volume2,
  ShieldAlert,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { api } from '../lib/api';

interface TokenTrackerProps {
  initialToken: Token;
  onRefresh?: () => void;
  canCancel?: boolean;
}

export const TokenTracker: React.FC<TokenTrackerProps> = ({
  initialToken,
  onRefresh,
  canCancel = false,
}) => {
  const [token, setToken] = useState<Token>(initialToken);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { requestBrowserPermission, browserNotificationsEnabled, showToast } = useNotification();

  // Sync when initialToken changes
  useEffect(() => {
    setToken(initialToken);
  }, [initialToken]);

  // Connect to SSE for real-time live updates on this token
  useEffect(() => {
    const eventSource = new EventSource(`/api/events/token/${token.id}`);

    eventSource.addEventListener('token_update', (e) => {
      try {
        const updateData = JSON.parse(e.data);
        setToken((prev) => ({
          ...prev,
          ...updateData,
          position_in_queue: updateData.position !== undefined ? updateData.position : prev.position_in_queue,
          estimated_wait_minutes: updateData.estimatedWait !== undefined ? updateData.estimatedWait : prev.estimated_wait_minutes,
          status: updateData.status || prev.status,
        }));

        if (updateData.status === 'called') {
          showToast({
            type: 'alert',
            title: 'TOKEN CALLED!',
            message: `Token ${token.token_number} has been called to the counter!`,
          });
        }
      } catch (err) {
        console.error('SSE token_update parse error:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [token.id, token.token_number, showToast]);

  // Manual refresh helper
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await api.tokens.get(token.id);
      setToken(refreshed);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to refresh token:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast({
      type: 'info',
      title: 'Link Copied',
      message: 'Token tracking link copied to clipboard.',
    });
  };

  const handleCancelToken = async () => {
    if (!confirm('Are you sure you want to cancel this token?')) return;
    try {
      await api.tokens.updateStatus(token.id, 'cancelled');
      setToken((prev) => ({ ...prev, status: 'cancelled' }));
      showToast({
        type: 'warning',
        title: 'Token Cancelled',
        message: 'Your token has been removed from the queue.',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to cancel token');
    }
  };

  // Status Styling
  const getStatusConfig = (status: TokenStatus) => {
    switch (status) {
      case 'serving':
        return {
          label: 'Currently Serving',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 glow-emerald',
          icon: <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />,
        };
      case 'called':
        return {
          label: 'CALLED TO COUNTER',
          badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-500/40 glow-amber animate-pulse',
          icon: <Volume2 className="w-4 h-4 text-amber-300" />,
        };
      case 'completed':
        return {
          label: 'Service Completed',
          badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          icon: <CheckCircle className="w-4 h-4 text-sky-400" />,
        };
      case 'skipped':
        return {
          label: 'Skipped / Absent',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-slate-700/40 text-slate-400 border-slate-600',
          icon: <ShieldAlert className="w-4 h-4 text-slate-400" />,
        };
      default:
        return {
          label: 'In Waiting Queue',
          badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 glow-indigo',
          icon: <Clock className="w-4 h-4 text-indigo-400" />,
        };
    }
  };

  const statusConfig = getStatusConfig(token.status);

  // Calculate circular SVG progress percentage
  // If position is 1, 85% done; if position is 5, 20% done
  const progressPercent =
    token.status === 'completed'
      ? 100
      : token.status === 'serving' || token.status === 'called'
      ? 95
      : Math.max(10, Math.min(90, Math.round(100 - token.position_in_queue * 15)));

  const strokeDashoffset = 440 - (440 * progressPercent) / 100;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Called Banner */}
      {token.status === 'called' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-2xl flex items-center justify-between animate-bounce-gentle">
          <div className="flex items-center gap-3">
            <Volume2 className="w-7 h-7 text-white animate-pulse" />
            <div>
              <h3 className="font-extrabold text-base tracking-wide uppercase">
                Attention: Your Token is Called!
              </h3>
              <p className="text-xs text-amber-100">
                Please proceed to {token.counter_name || 'the assigned counter'} immediately.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-white text-orange-700 font-bold text-xs uppercase">
            Step Up
          </span>
        </div>
      )}

      {/* Main Digital Token Pass */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-indigo-500/20">
        {/* Glow ambient background element */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Pass Header: Location & Service */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mb-1">
              <Building className="w-3.5 h-3.5" />
              <span>{token.location_name || 'Public Facility'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {token.service_name || 'General Service'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </span>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh Queue Status"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Core Center: Token Badge + Progress Ring */}
        <div className="py-8 flex flex-col sm:flex-row items-center justify-around gap-8">
          {/* Circular Progress & Position */}
          <div className="relative flex items-center justify-center">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-800/60"
                fill="transparent"
              />
              <circle
                cx="96"
                cy="96"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                className="text-indigo-500 transition-all duration-700 ease-out"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Position info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {token.status === 'waiting' ? (
                <>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Position
                  </span>
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    #{token.position_in_queue}
                  </span>
                  <span className="text-[11px] text-indigo-400 font-medium">in queue line</span>
                </>
              ) : token.status === 'called' ? (
                <>
                  <Volume2 className="w-8 h-8 text-amber-400 animate-pulse mb-1" />
                  <span className="text-xs font-bold text-amber-300 uppercase">CALLED</span>
                </>
              ) : token.status === 'serving' ? (
                <>
                  <CheckCircle className="w-8 h-8 text-emerald-400 animate-pulse mb-1" />
                  <span className="text-xs font-bold text-emerald-300 uppercase">Serving</span>
                </>
              ) : (
                <span className="text-xs font-bold text-slate-400 uppercase">
                  {token.status}
                </span>
              )}
            </div>
          </div>

          {/* Large Token Badge */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Digital Token Number
            </span>
            <div className="px-6 py-3 rounded-2xl bg-gradient-to-br from-indigo-900/60 via-slate-900 to-indigo-950/80 border-2 border-indigo-500/40 glow-indigo">
              <span className="text-4xl sm:text-5xl font-black tracking-wider text-white font-mono">
                {token.token_number}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-slate-200">
                {token.status === 'waiting'
                  ? `Est. Wait: ~${token.estimated_wait_minutes} mins`
                  : token.status === 'serving'
                  ? 'At Counter Now'
                  : 'Turn in Progress'}
              </span>
            </div>

            {token.counter_name && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                <span>Assigned: {token.counter_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Advisory Box */}
        {token.ai_advisory && (
          <div className="mt-4 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">
                    {token.ai_advisory.title}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/20">
                    Gemini AI Advisory
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {token.ai_advisory.body}
                </p>
                {token.ai_advisory.actionHint && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-cyan-300 font-medium">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>{token.ai_advisory.actionHint}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QR Code & Check-in section */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-md">
              <QRCodeSVG
                value={`${window.location.origin}/token/${token.id}`}
                size={64}
                level="M"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Token QR Verification</p>
              <p className="text-[11px] text-slate-400">
                Present this QR or code at the counter when called.
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {token.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!browserNotificationsEnabled && (
              <button
                onClick={requestBrowserPermission}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Alerts</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>

            {canCancel && token.status === 'waiting' && (
              <button
                onClick={handleCancelToken}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
              >
                Cancel Token
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
