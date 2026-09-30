import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Location } from '../../../shared/schemas';
import { LocationCard } from '../components/LocationCard';
import { LoadingSpinner, EmptyState } from '../components/Common';
import { Search, MapPin, Filter, Layers } from 'lucide-react';

export const LocationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const city = searchParams.get('city') || 'all';

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    async function loadLocations() {
      setIsLoading(true);
      try {
        const data = await api.locations.list({
          category: category !== 'all' ? category : undefined,
          city: city !== 'all' ? city : undefined,
          search: search || undefined,
        });
        setLocations(data);
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLocations();
  }, [category, city, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('search', searchInput.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const setCategoryFilter = (cat: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  const categories = [
    { id: 'all', label: 'All Facilities' },
    { id: 'healthcare', label: 'Healthcare' },
    { id: 'banking', label: 'Banking' },
    { id: 'government', label: 'Government' },
    { id: 'education', label: 'Education' },
    { id: 'utility', label: 'Utilities' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Browse Facilities & Live Queues
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Select a facility to view current wait times, active counters, and join digital queues.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search facility name, address, or service..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                category === c.id || (c.id === 'all' && category === 'all')
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Found {locations.length} public facility location(s)</span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading facilities..." />
      ) : locations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <LocationCard key={loc.id} location={loc} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Facilities Found"
          description="We couldn't find any locations matching your search criteria. Try modifying your search or resetting filters."
          actionText="Reset Filters"
          onAction={() => setSearchParams(new URLSearchParams())}
        />
      )}
    </div>
  );
};
