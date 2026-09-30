import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Location, QueueAnalytics } from '../../../shared/schemas';
import { LoadingSpinner, EmptyState } from '../components/Common';
import {
  BarChart3,
  Sparkles,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Building,
  Layers,
  ChevronRight,
  Flame,
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    searchParams.get('locationId') || ''
  );
  const [analytics, setAnalytics] = useState<QueueAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load locations
  useEffect(() => {
    async function init() {
      try {
        const locs = await api.locations.list();
        setLocations(locs);
        if (locs.length > 0 && !selectedLocationId) {
          setSelectedLocationId(locs[0].id);
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
      }
    }
    init();
  }, []);

  // Load analytics when selected location changes
  useEffect(() => {
    async function loadAnalyticsData() {
      if (!selectedLocationId) return;
      setIsLoading(true);
      try {
        const data = await api.analytics.getLocation(selectedLocationId);
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalyticsData();
  }, [selectedLocationId]);

  const handleLocationChange = (id: string) => {
    setSelectedLocationId(id);
    setSearchParams({ locationId: id });
  };

  if (isLoading && !analytics) {
    return <LoadingSpinner message="Generating Gemini queue analytics & throughput charts..." />;
  }

  // Chart helpers
  const hourlyStats = analytics?.hourlyStats || [];
  const maxServed = Math.max(1, ...hourlyStats.map((h) => h.servedCount));
  const maxWait = Math.max(1, ...hourlyStats.map((h) => h.avgWaitMinutes));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/admin" className="hover:text-white">Admin</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-medium">Analytics & Insights</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Live Queue Analytics
          </h1>
          <p className="text-xs text-slate-400">
            Real-time throughput, wait time forecasting, and Gemini AI anomaly detection.
          </p>
        </div>

        {/* Facility Selector */}
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-400" />
          <select
            value={selectedLocationId}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {analytics ? (
        <>
          {/* AI Anomaly & Optimization Card */}
          {analytics.aiAnomaly && (
            <div
              className={`p-6 rounded-3xl border backdrop-blur-xl space-y-3 ${
                analytics.aiAnomaly.hasAnomaly
                  ? 'bg-amber-950/40 border-amber-500/40 glow-amber'
                  : 'bg-emerald-950/30 border-emerald-500/30 glow-emerald'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className={`w-5 h-5 ${
                      analytics.aiAnomaly.hasAnomaly ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  />
                  <h3 className="text-base font-bold text-white">
                    Gemini AI Advisory & Queue Optimization
                  </h3>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                    analytics.aiAnomaly.hasAnomaly
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {analytics.aiAnomaly.hasAnomaly
                    ? `${analytics.aiAnomaly.severity.toUpperCase()} ALERT`
                    : 'NORMAL FLOW'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {analytics.aiAnomaly.suggestion}
              </p>

              <div className="pt-2 flex items-center gap-4 text-xs text-slate-300">
                <span>
                  Recommended Open Counters:{' '}
                  <strong className="text-white font-mono text-sm">
                    {analytics.aiAnomaly.recommendedOpenCounters}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Currently Active:{' '}
                  <strong className="text-cyan-300 font-mono text-sm">
                    {analytics.activeCounters}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* Metric Overview Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Waiting</span>
              <p className="text-2xl font-black text-amber-300 mt-1">{analytics.totalWaiting}</p>
              <span className="text-[10px] text-slate-500">citizens</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Served Today</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {analytics.totalServedToday}
              </p>
              <span className="text-[10px] text-slate-500">completed</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Avg Wait</span>
              <p className="text-2xl font-black text-white mt-1">
                {analytics.averageWaitMinutes}m
              </p>
              <span className="text-[10px] text-slate-500">per citizen</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Avg Service</span>
              <p className="text-2xl font-black text-white mt-1">
                {analytics.averageServiceMinutes}m
              </p>
              <span className="text-[10px] text-slate-500">at window</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Counters</span>
              <p className="text-2xl font-black text-cyan-400 mt-1">
                {analytics.activeCounters}
              </p>
              <span className="text-[10px] text-slate-500">open stations</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Peak Hour</span>
              <p className="text-base font-black text-purple-400 mt-2 truncate">
                {analytics.peakHour}
              </p>
              <span className="text-[10px] text-slate-500">highest volume</span>
            </div>
          </div>

          {/* SVG Visual Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hourly Throughput Bar Chart */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Hourly Throughput (Tokens Served)</h3>
                </div>
                <span className="text-[11px] text-slate-400">Today</span>
              </div>

              {/* Pure SVG Bar Chart */}
              <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
                {hourlyStats.map((h, i) => {
                  const heightPercent = Math.max(10, Math.round((h.servedCount / maxServed) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-bold text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        {h.servedCount}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400 group-hover:from-indigo-500 group-hover:to-cyan-300 transition-all duration-300 shadow-md shadow-indigo-600/20"
                      />
                      <span className="text-[9px] text-slate-400 whitespace-nowrap transform -rotate-45 sm:rotate-0 origin-top-left sm:origin-center mt-1">
                        {h.hour.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Average Wait Time Curve Line Chart */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Average Wait Time Trend (Minutes)</h3>
                </div>
                <span className="text-[11px] text-slate-400">Curve</span>
              </div>

              {/* SVG Polyline Chart */}
              <div className="h-56 relative pt-4 flex flex-col justify-between">
                <svg className="w-full h-44 overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 120">
                  <defs>
                    <linearGradient id="waitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Area fill */}
                  <polygon
                    points={`0,120 ${hourlyStats
                      .map((h, i) => {
                        const x = (i / (hourlyStats.length - 1 || 1)) * 500;
                        const y = 120 - (h.avgWaitMinutes / (maxWait || 1)) * 100;
                        return `${x},${y}`;
                      })
                      .join(' ')} 500,120`}
                    fill="url(#waitGrad)"
                  />

                  {/* Line */}
                  <polyline
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={hourlyStats
                      .map((h, i) => {
                        const x = (i / (hourlyStats.length - 1 || 1)) * 500;
                        const y = 120 - (h.avgWaitMinutes / (maxWait || 1)) * 100;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />

                  {/* Circles */}
                  {hourlyStats.map((h, i) => {
                    const x = (i / (hourlyStats.length - 1 || 1)) * 500;
                    const y = 120 - (h.avgWaitMinutes / (maxWait || 1)) * 100;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        className="fill-cyan-400 stroke-slate-900 stroke-2"
                      />
                    );
                  })}
                </svg>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 border-t border-slate-800 pt-2">
                  <span>9:00 AM</span>
                  <span>1:00 PM</span>
                  <span>5:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Breakdown Table */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Service Counter Breakdown</h3>
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Service Name</th>
                      <th className="px-5 py-3.5">Waiting Tokens</th>
                      <th className="px-5 py-3.5">Served Today</th>
                      <th className="px-5 py-3.5">Average Wait</th>
                      <th className="px-5 py-3.5 text-right">Active Counters</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {analytics.serviceBreakdown.map((s) => (
                      <tr key={s.serviceId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white">{s.serviceName}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-amber-300">{s.waitingCount} in line</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300 font-medium">{s.servedCount}</td>
                        <td className="px-5 py-3.5 text-cyan-300 font-medium">~{s.avgWaitMinutes} min</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-emerald-400">
                          {s.activeCounters} open
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="No Analytics Data"
          description="Select a facility location to view live queue performance data."
        />
      )}
    </div>
  );
};
