import React from 'react';
import { Link } from 'react-router-dom';
import { Service } from '../../../shared/schemas';
import { Users, Clock, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  showLocationName?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  showLocationName = false,
}) => {
  const waitingCount = service.waiting_tokens_count ?? 0;
  const activeCounters = service.active_counters_count ?? 1;
  const estimatedWait = service.estimated_wait_minutes ?? 8;

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-800 transition-all duration-300">
      <div>
        {showLocationName && service.location_name && (
          <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            {service.location_name}
          </p>
        )}

        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-bold text-white tracking-tight">
            {service.name}
          </h3>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
            <Clock className="w-3 h-3 text-cyan-400" />
            ~{estimatedWait}m wait
          </span>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {service.description || 'Standard public service counter.'}
        </p>

        {/* Serving Now pill if available */}
        {service.currently_serving_token && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Serving Now: <strong>{service.currently_serving_token}</strong></span>
          </div>
        )}
      </div>

      <div>
        {/* Service Stats Bar */}
        <div className="grid grid-cols-2 gap-2 py-3 border-t border-slate-800/80 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[11px] text-slate-400">Waiting</p>
              <p className="font-bold text-white">{waitingCount} tokens</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-[11px] text-slate-400">Counters</p>
              <p className="font-bold text-white">{activeCounters} active</p>
            </div>
          </div>
        </div>

        <Link
          to={`/join/${service.id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-200 group"
        >
          <span>Join Queue</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
