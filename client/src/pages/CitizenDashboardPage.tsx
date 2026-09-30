import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Token } from '../../../shared/schemas';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, EmptyState } from '../components/Common';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  Building,
  Volume2,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTokens = async () => {
    setIsLoading(true);
    try {
      const data = await api.tokens.my();
      setTokens(data);
    } catch (err) {
      console.error('Failed to load my tokens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  const activeTokens = tokens.filter((t) => ['waiting', 'called', 'serving'].includes(t.status));
  const pastTokens = tokens.filter((t) => ['completed', 'skipped', 'cancelled'].includes(t.status));

  if (isLoading) {
    return <LoadingSpinner message="Loading your queue tokens..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Queue Passes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome, <strong>{user?.full_name}</strong>. Track your active positions and review past visits.
          </p>
        </div>

        <Link
          to="/locations"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Join New Queue</span>
        </Link>
      </div>

      {/* Active Tokens Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Tokens ({activeTokens.length})</span>
          </h2>
        </div>

        {activeTokens.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTokens.map((token) => (
              <div
                key={token.id}
                className="glass-panel rounded-2xl p-6 border border-indigo-500/30 glow-indigo relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      {token.location_name || 'Public Facility'}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        token.status === 'called'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : token.status === 'serving'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      }`}
                    >
                      {token.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                    {token.service_name}
                  </h3>

                  <div className="py-4 my-2 flex items-center justify-between border-y border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                        Token Number
                      </p>
                      <p className="text-3xl font-black text-white font-mono">
                        {token.token_number}
                      </p>
                    </div>

                    <div className="text-right">
                      {token.status === 'waiting' ? (
                        <>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                            Position
                          </p>
                          <p className="text-2xl font-black text-cyan-400">
                            #{token.position_in_queue}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            ~{token.estimated_wait_minutes} min wait
                          </p>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                          <Volume2 className="w-4 h-4 animate-pulse" />
                          <span>Turn Ready!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  to={`/token/${token.id}`}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs text-center flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <span>Open Live Tracking Pass</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Active Queue Tokens"
            description="You are not currently in any waiting lines. Select a facility to join a queue."
            actionText="Find Facilities"
            onAction={() => (window.location.href = '/locations')}
          />
        )}
      </div>

      {/* Past History Table */}
      {pastTokens.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h2 className="text-base font-bold text-white">Completed & Past Visits ({pastTokens.length})</h2>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Token</th>
                    <th className="px-5 py-3.5">Facility & Service</th>
                    <th className="px-5 py-3.5">Joined Time</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {pastTokens.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-white">
                        {t.token_number}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-200">{t.service_name}</div>
                        <div className="text-[11px] text-slate-500">{t.location_name}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {format(new Date(t.joined_at), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.status === 'completed'
                              ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/token/${t.id}`}
                          className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          View Pass
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
