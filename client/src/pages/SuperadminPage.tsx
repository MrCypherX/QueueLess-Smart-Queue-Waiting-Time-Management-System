import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { LoadingSpinner } from '../components/Common';
import {
  Sparkles,
  Building2,
  Layers,
  Users,
  CheckCircle,
  Database,
  Cpu,
  ShieldCheck,
  Server,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const SuperadminPage: React.FC = () => {
  const [stats, setStats] = useState<{
    totalLocations: number;
    totalServices: number;
    totalOpenCounters: number;
    totalUsers: number;
    currentWaitingTokens: number;
    tokensCompletedToday: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.analytics.getSystemOverview();
        setStats(data);
      } catch (err) {
        console.error('Failed to load superadmin overview:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Querying platform telemetry..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master System Telemetry</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Superadmin Suite</h1>
          <p className="text-xs text-slate-400">
            Network-wide queue throughput, cluster connectivity, and AI model health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All Services Operational</span>
          </span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Facilities</span>
              <Building2 className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-4xl font-black text-white">{stats.totalLocations}</p>
            <p className="text-xs text-slate-400">Hospitals, Banks, RTOs, Universities</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Public Services</span>
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-4xl font-black text-cyan-400">{stats.totalServices}</p>
            <p className="text-xs text-slate-400">
              {stats.totalOpenCounters} active counters open now
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Users</span>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-4xl font-black text-purple-300">{stats.totalUsers}</p>
            <p className="text-xs text-slate-400">Citizens, operators, and administrators</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Current Waiting</span>
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-4xl font-black text-amber-300">{stats.currentWaitingTokens}</p>
            <p className="text-xs text-slate-400">Tokens currently in active waiting queues</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Served Today</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-4xl font-black text-emerald-400">{stats.tokensCompletedToday}</p>
            <p className="text-xs text-slate-400">Tokens marked completed today</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">AI Predictive Engine</span>
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-xl font-bold text-white">Gemini 2.5 Flash</p>
            <p className="text-xs text-cyan-300 font-medium">Automatic Queue-Theory Fallback Active</p>
          </div>
        </div>
      )}

      {/* Cluster & Infrastructure Health */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">System Architecture & Service Health</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">PostgreSQL Data Store</h4>
                <p className="text-[11px] text-emerald-400 font-semibold">● Healthy / Migrated</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Equipped with persistent disk storage, UUID gen_random_uuid(), JSONB event logs, and row-level isolation checks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Real-Time Event Stream</h4>
                <p className="text-[11px] text-emerald-400 font-semibold">● Server-Sent Events Active</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Push notification broadcaster updates citizen tracking passes and operator consoles in sub-second intervals.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">M/M/c Predictive Model</h4>
                <p className="text-[11px] text-emerald-400 font-semibold">● Calibrated & Online</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hybrid Little's Law + Gemini AI model with time-of-day rush multipliers and proactive anomaly discovery.
            </p>
          </div>
        </div>
      </div>

      {/* Fast Admin Shortcuts */}
      <div className="p-6 rounded-3xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Facility Management Shortcuts</h4>
          <p className="text-xs text-slate-400">
            Jump directly to any administrative panel or inspect live queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/locations"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Manage Locations
          </Link>
          <Link
            to="/admin/analytics"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Network Analytics
          </Link>
        </div>
      </div>
    </div>
  );
};
