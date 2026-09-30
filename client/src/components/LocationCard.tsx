import React from 'react';
import { Link } from 'react-router-dom';
import { Location, LocationCategory } from '../../../shared/schemas';
import {
  Building2,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  HeartPulse,
  Landmark,
  FileText,
  GraduationCap,
  Zap,
} from 'lucide-react';

interface LocationCardProps {
  location: Location;
}

export const getCategoryMeta = (category: LocationCategory) => {
  switch (category) {
    case 'healthcare':
      return {
        label: 'Healthcare',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        icon: <HeartPulse className="w-3.5 h-3.5" />,
      };
    case 'banking':
      return {
        label: 'Banking & Finance',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        icon: <Landmark className="w-3.5 h-3.5" />,
      };
    case 'government':
      return {
        label: 'Government & Public',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        icon: <FileText className="w-3.5 h-3.5" />,
      };
    case 'education':
      return {
        label: 'Higher Education',
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        icon: <GraduationCap className="w-3.5 h-3.5" />,
      };
    case 'utility':
      return {
        label: 'Utilities & Power',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        icon: <Zap className="w-3.5 h-3.5" />,
      };
    default:
      return {
        label: 'Public Facility',
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
        icon: <Building2 className="w-3.5 h-3.5" />,
      };
  }
};

export const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  const meta = getCategoryMeta(location.category);

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-800 transition-all duration-300">
      <div>
        {/* Top category & City */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}
          >
            {meta.icon}
            {meta.label}
          </span>
          {location.city && (
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              {location.city}
            </span>
          )}
        </div>

        {/* Location Title */}
        <h3 className="text-lg font-bold text-white tracking-tight mb-2 line-clamp-1">
          {location.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {location.description || 'Public service facility providing digital queue tokens.'}
        </p>
      </div>

      <div>
        {/* Live Queue Indicators */}
        <div className="grid grid-cols-2 gap-2 py-3 border-t border-slate-800/80 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-slate-400 text-[11px]">In Queue</p>
              <p className="font-bold text-white">
                {location.total_waiting ?? 0} citizens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-slate-400 text-[11px]">Est. Wait</p>
              <p className="font-bold text-cyan-300">
                ~{location.min_wait_minutes ?? 5} min
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/locations/${location.id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-indigo-600 text-white text-xs font-semibold transition-all duration-200 group shadow-md"
        >
          <span>View Services & Queues</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
