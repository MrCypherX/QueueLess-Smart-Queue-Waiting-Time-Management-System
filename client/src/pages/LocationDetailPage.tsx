import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Location, Service } from '../../../shared/schemas';
import { ServiceCard } from '../components/ServiceCard';
import { getCategoryMeta } from '../components/LocationCard';
import { LoadingSpinner, EmptyState } from '../components/Common';
import {
  MapPin,
  Clock,
  Users,
  Building,
  ArrowLeft,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const LocationDetailPage: React.FC = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      if (!locationId) return;
      setIsLoading(true);
      try {
        const res = await api.locations.get(locationId);
        setLocation(res.location);
        setServices(res.services);
      } catch (err: any) {
        setError(err.message || 'Failed to load location details');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetail();
  }, [locationId]);

  // Connect to SSE for real-time queue updates across this location's services
  useEffect(() => {
    const eventSource = new EventSource('/api/events/all-queues');

    eventSource.addEventListener('queue_update', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.serviceId) {
          setServices((prev) =>
            prev.map((s) => {
              if (s.id === data.serviceId) {
                const waiting = data.waitingCount !== undefined ? data.waitingCount : s.waiting_tokens_count;
                const counters = data.activeCounters !== undefined ? data.activeCounters : s.active_counters_count;
                const estWait = Math.round(((waiting || 0) / Math.max(1, counters || 1)) * (s.average_service_time_minutes || 8));
                return {
                  ...s,
                  waiting_tokens_count: waiting,
                  active_counters_count: counters,
                  estimated_wait_minutes: Math.max(1, estWait),
                };
              }
              return s;
            })
          );
        }
      } catch (err) {
        console.error('SSE queue_update error:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading facility and services..." />;
  }

  if (error || !location) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          title="Facility Not Found"
          description={error || 'The requested location could not be located.'}
          actionText="Back to Facilities"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const meta = getCategoryMeta(location.category);
  const totalWaiting = services.reduce((acc, s) => acc + (s.waiting_tokens_count || 0), 0);
  const totalCounters = services.reduce((acc, s) => acc + (s.active_counters_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/locations" className="hover:text-white transition-colors">
          Facilities
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-white font-medium truncate">{location.name}</span>
      </div>

      {/* Facility Hero Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${meta.color}`}
          >
            {meta.icon}
            {meta.label}
          </span>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" />
              <strong>{totalWaiting}</strong> in line now
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <strong>{totalCounters}</strong> active counters
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          {location.name}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          {location.description}
        </p>

        {location.address && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              {location.address}, {location.city || ''}
            </span>
          </div>
        )}
      </div>

      {/* Services List Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Available Service Counters
            </h2>
            <p className="text-xs text-slate-400">
              Select a service below to join its digital queue and generate your live token pass.
            </p>
          </div>
          <span className="text-xs text-slate-400">{services.length} active service(s)</span>
        </div>

        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Services Registered"
            description="There are currently no active services configured for this location."
          />
        )}
      </div>
    </div>
  );
};
