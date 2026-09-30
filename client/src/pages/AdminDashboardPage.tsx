import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Location } from '../../../shared/schemas';
import { LoadingSpinner } from '../components/Common';
import {
  Building2,
  Users,
  Clock,
  Sparkles,
  BarChart3,
  Layers,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLocations() {
      try {
        const data = await api.locations.list();
        setLocations(data);
      } catch (err) {
        console.error('Failed to load admin locations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLocations();
  }, []);

  const totalWaiting = locations.reduce((sum, l) => sum + (l.total_waiting || 0), 0);
  const totalServices = locations.reduce((sum, l) => sum + (l.services_count || 0), 0);

  if (isLoading) {
    return <LoadingSpinner message="Loading admin facility dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Facility Management Console</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Overview</h1>
          <p className="text-xs text-slate-400">
            Control service counters, queue capacities, and view Gemini AI performance forecasts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Live Analytics</span>
          </Link>
          <Link
            to="/admin/locations"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Facility</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Facilities</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-white">{locations.length}</p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>All operating online</span>
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Services</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white">{totalServices}</p>
          <p className="text-[11px] text-slate-400">Active public counters</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">In Queues Now</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-300">{totalWaiting}</p>
          <p className="text-[11px] text-slate-400">Across all locations</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Engine</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-white">Gemini 2.5 Flash</p>
          <p className="text-[11px] text-indigo-300 font-medium">Predictive Anomaly Sync</p>
        </div>
      </div>

      {/* Facilities Management Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Managed Public Facilities</h2>
          <div className="flex items-center gap-3 text-xs">
            <Link to="/admin/locations" className="text-indigo-400 hover:text-indigo-300">
              Manage Locations
            </Link>
            <span className="text-slate-600">·</span>
            <Link to="/admin/services" className="text-indigo-400 hover:text-indigo-300">
              Manage Services
            </Link>
            <span className="text-slate-600">·</span>
            <Link to="/admin/counters" className="text-indigo-400 hover:text-indigo-300">
              Manage Counters
            </Link>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Facility Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">City</th>
                  <th className="px-5 py-3.5">Services</th>
                  <th className="px-5 py-3.5">Live Waiting</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white">{loc.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {loc.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{loc.city || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-300 font-medium">{loc.services_count}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-cyan-300">
                        {loc.total_waiting} waiting
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-3">
                      <Link
                        to={`/admin/analytics?locationId=${loc.id}`}
                        className="text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        Analytics
                      </Link>
                      <Link
                        to={`/locations/${loc.id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        View Queues
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
