import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Location, LocationCategory } from '../../../shared/schemas';
import { useNotification } from '../context/NotificationContext';
import { LoadingSpinner, EmptyState } from '../components/Common';
import {
  Building2,
  Plus,
  MapPin,
  Edit2,
  X,
  Check,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminLocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const { showToast } = useNotification();

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<LocationCategory>('healthcare');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const data = await api.locations.list();
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const openCreateModal = () => {
    setEditingLoc(null);
    setName('');
    setSlug('');
    setCategory('healthcare');
    setCity('');
    setAddress('');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (loc: Location) => {
    setEditingLoc(loc);
    setName(loc.name);
    setSlug(loc.slug);
    setCategory(loc.category);
    setCity(loc.city || '');
    setAddress(loc.address || '');
    setDescription(loc.description || '');
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingLoc) {
      // Auto-generate slug
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingLoc) {
        await api.locations.update(editingLoc.id, {
          name,
          slug,
          category,
          city,
          address,
          description,
        });
        showToast({ type: 'success', title: 'Location Updated', message: `${name} has been updated.` });
      } else {
        await api.locations.create({
          name,
          slug,
          category,
          city,
          address,
          description,
        });
        showToast({ type: 'success', title: 'Location Created', message: `${name} registered successfully.` });
      }
      setModalOpen(false);
      loadLocations();
    } catch (err: any) {
      showToast({ type: 'warning', title: 'Operation Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/admin" className="hover:text-white">Admin</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-medium">Locations</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Facility Locations</h1>
          <p className="text-xs text-slate-400">
            Create and maintain facilities where digital queues and services operate.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Location</span>
        </button>
      </div>

      {/* Locations Table */}
      {isLoading ? (
        <LoadingSpinner message="Loading facilities..." />
      ) : locations.length > 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Facility Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Slug</th>
                  <th className="px-5 py-3.5">City & Address</th>
                  <th className="px-5 py-3.5">Services</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white">
                      {loc.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {loc.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">{loc.slug}</td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {loc.city ? `${loc.city}, ` : ''}{loc.address || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-cyan-300">
                      {loc.services_count} services
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEditModal(loc)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Location"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Locations Configured"
          description="Click Add New Location to register your first public facility."
          actionText="Add Location"
          onAction={openCreateModal}
        />
      )}

      {/* Modal: Create / Edit Location */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 max-w-lg w-full relative shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingLoc ? 'Edit Facility Location' : 'Register New Location'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. City General Hospital"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="city-general-hospital"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Domain Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LocationCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 capitalize"
                  >
                    <option value="healthcare">Healthcare</option>
                    <option value="banking">Banking</option>
                    <option value="government">Government</option>
                    <option value="education">Education</option>
                    <option value="utility">Utility</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Chicago"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Facility overview and queue instructions..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingLoc ? 'Save Changes' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
