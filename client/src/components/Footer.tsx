import React from 'react';
import { Layers, ShieldCheck, Heart, Sparkles, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Queue<span className="text-indigo-400">Less</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              Smart Queue & Predictive Waiting-Time Management System powered by Google Gemini AI. Eliminating physical overcrowding and waiting anxiety across public facilities.
            </p>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
              <Cpu className="w-3.5 h-3.5" />
              <span>Real-time SSE Sync + M/M/c Queue Engine</span>
            </div>
          </div>

          {/* Public Services */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Domains Covered
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Healthcare & Diagnostic OPDs</li>
              <li>Banking & Wealth Counters</li>
              <li>Government & Transport (RTO)</li>
              <li>University & College Registries</li>
              <li>Consumer Utility Desks</li>
            </ul>
          </div>

          {/* Quick links & status */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              System Architecture
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>PostgreSQL DB Connected</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Gemini 2.5 Flash Advisory</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                <span>Strict Row-Level Isolation</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} QueueLess System. Production-Ready Deployment.</p>
          <div className="flex items-center gap-4">
            <Link to="/locations" className="hover:text-slate-300 transition-colors">
              Public Facilities
            </Link>
            <Link to="/login" className="hover:text-slate-300 transition-colors">
              Operator Portal
            </Link>
            <Link to="/admin" className="hover:text-slate-300 transition-colors">
              Admin Suite
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
