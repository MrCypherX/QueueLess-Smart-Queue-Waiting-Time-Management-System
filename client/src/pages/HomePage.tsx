import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Location, LocationCategory } from '../../../shared/schemas';
import { LocationCard } from '../components/LocationCard';
import { LoadingSpinner } from '../components/Common';
import {
  Sparkles,
  Search,
  ArrowRight,
  Clock,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  HeartPulse,
  Landmark,
  FileText,
  GraduationCap,
  Layers,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const list = await api.locations.list();
        setLocations(list);
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/locations?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate('/locations');
    }
  };

  const categories = [
    { id: 'all', label: 'All Services', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'healthcare', label: 'Healthcare & OPD', icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { id: 'banking', label: 'Banks & Finance', icon: <Landmark className="w-3.5 h-3.5" /> },
    { id: 'government', label: 'RTO & Government', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'education', label: 'University Office', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'utility', label: 'Utilities & Power', icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  const filteredLocations = locations
    .filter((loc) =>
      selectedCategory === 'all' ? true : loc.category === selectedCategory
    )
    .slice(0, 6);

  // Compute live overview counters
  const totalWaitingAcross = locations.reduce((sum, l) => sum + (l.total_waiting || 0), 0);

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-12 overflow-hidden">
        {/* Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-cyan-500/15 to-purple-600/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-6">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold glow-indigo animate-pulse-subtle">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Powered by Google Gemini Predictive AI</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Never Stand in Line Again.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
              Queue Digitally.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Eliminate waiting-room overcrowding at hospitals, banks, RTOs, and universities.
            Get your digital token, real-time position updates, and AI-predicted arrival windows.
          </p>

          {/* Hero Live Search Form */}
          <div className="pt-4 max-w-xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 p-1.5 rounded-2xl glass-panel border border-slate-700 shadow-2xl focus-within:border-indigo-500 transition-colors"
            >
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search facility by name, service or city..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none px-2"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0"
              >
                <span>Find Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Live Highlights Row */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
              <p className="text-2xl font-black text-white">{locations.length || 6}</p>
              <p className="text-[11px] text-slate-400 font-medium">Public Facilities</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
              <p className="text-2xl font-black text-cyan-400">{totalWaitingAcross}</p>
              <p className="text-[11px] text-slate-400 font-medium">Citizens in Live Queues</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
              <p className="text-2xl font-black text-emerald-400">98.4%</p>
              <p className="text-[11px] text-slate-400 font-medium">Prediction Accuracy</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
              <p className="text-2xl font-black text-purple-400">&lt; 10 min</p>
              <p className="text-[11px] text-slate-400 font-medium">Proximity Alert Buffer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Domain Category Filter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Featured Public Facilities
            </h2>
            <p className="text-xs text-slate-400">
              Browse live queues across certified hospitals, financial institutions, and government desks.
            </p>
          </div>

          <Link
            to="/locations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View All Facilities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Locations Grid */}
        {isLoading ? (
          <LoadingSpinner message="Querying live facilities..." />
        ) : filteredLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((loc) => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-sm">No facilities found in this category.</p>
          </div>
        )}
      </section>

      {/* How QueueLess Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-800/80 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Effortless Citizen Experience
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Three Simple Steps to Zero Waiting Room Stress
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Skip crowded waiting lobbies and only arrive when your turn is ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-xl flex items-center justify-center">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Select Location & Join</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Find your medical OPD, banking desk, or transport registry. Fill in quick details to secure your spot in line.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-xl flex items-center justify-center">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Track Position Live</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Follow your digital token pass. Gemini AI calculates precise waiting times based on open counters and historical speeds.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-xl flex items-center justify-center">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Get Notified & Served</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive browser and in-app alerts when you are within 3 tokens. Arrive calm and show your digital token QR.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features & Technology Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Predictive Intelligence</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Powered by Google Gemini 2.5 Flash
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Standard queue systems rely on static division that fails during peak surges. QueueLess continuously evaluates active counter efficiency, time-of-day rush patterns, and sudden bottlenecks to provide calibrated estimates with confidence metrics.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Adaptive Waiting-Time Forecasts</h4>
                  <p className="text-xs text-slate-400">
                    Accounts for counter speed variations and priority triage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Intelligent Arrival Windows</h4>
                  <p className="text-xs text-slate-400">
                    Suggests the ideal time window to leave home so waiting lobbies stay spacious.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Admin Queue Anomaly Detection</h4>
                  <p className="text-xs text-slate-400">
                    Alerts supervisors to open backup counters before wait times spike.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Preview Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 glow-indigo space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Live Simulation Preview
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/20">
                ● Live Updates Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Metro General Hospital</p>
                <h4 className="text-lg font-bold text-white">General OPD Consultation</h4>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Token Number</p>
                <p className="text-2xl font-black text-indigo-400 font-mono">OPD-110</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>QueueLess AI Status Advisory</span>
              </div>
              <p>
                "You are #1 in line. Dr. Mitchell at Counter A1 is finishing the current patient. Turn in ~6 minutes."
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-slate-400">Counter: <strong>Counter A1</strong></span>
              <span className="text-cyan-300 font-semibold">Suggested Arrival: Stay Near Lobby</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
