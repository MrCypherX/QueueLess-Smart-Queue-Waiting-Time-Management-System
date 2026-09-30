import React from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { EmptyState } from '../components/Common';
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    requestBrowserPermission,
    browserNotificationsEnabled,
  } = useNotification();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-400">
            Real-time proximity updates and queue status alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!browserNotificationsEnabled && (
            <button
              onClick={requestBrowserPermission}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              Enable Browser Alerts
            </button>
          )}

          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
              className={`glass-panel p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                notif.is_read
                  ? 'border-slate-800/80 bg-slate-950/40 text-slate-400'
                  : 'border-indigo-500/30 bg-slate-900/80 text-white glow-indigo'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                    <h3 className="text-sm font-semibold text-white">{notif.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{notif.body}</p>
                  <p className="text-[10px] text-slate-500 pt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(notif.created_at), 'MMM d, h:mm a')}</span>
                  </p>
                </div>

                {notif.token_id && (
                  <Link
                    to={`/token/${notif.token_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors shrink-0"
                    title="View Token Pass"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="w-10 h-10 text-slate-500" />}
          title="No Notifications Yet"
          description="You will receive alerts here when your turn approaches or when an operator calls your token."
        />
      )}
    </div>
  );
};
