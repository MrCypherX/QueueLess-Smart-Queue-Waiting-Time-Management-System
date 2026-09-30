import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Location, Service } from '../../../shared/schemas';
import { useNotification } from '../context/NotificationContext';
import { LoadingSpinner, EmptyState } from '../components/Common';
import {
  Layers,
  Plus,
  Edit2,
  Clock,
  Building,
  X,
  ChevronRight,
} from 'lucide-react';

export const AdminServicesPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { showToast } = useNotification();

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avgTime, setAvgTime] = useState(8);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const locs = await api.locations.list();
        setLocations(locs);
        if (locs.length > 0) {
          setSelectedLocationId(locs[0].id);
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const loadServices = async () => {
    if (!selectedLocationId) return;
    try {
      const data = await api.services.getByLocation(selectedLocationId);
      setServices(data);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  useEffect(() => {
    loadServices();
  }, [selectedLocationId]);

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setAvgTime(8);
    setModalOpen(true);
  };

  const openEditModal = (s: Service) => {
    setEditingService(s);
    setName(s.name);
    setDescription(s.description || '');
    setAvgTime(s.average_service_time_minutes);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocationId) return;

    setIsSubmitting(true);
    try {
      if (editingService) {
        await api.services.update(editingService.id, {
          name,
          description,
          average_service_time_minutes: Number(avgTime),
        });
        showToast({ type: 'success', title: 'Service Updated', message: `${name} updated successfully.` });
      } else {
        await api.services.create({
          location_id: selectedLocationId,
          name,
          description,
          average_service_time_minutes: Number(avgTime),
        });
        showToast({ type: 'success', title: 'Service Created', message: `${name} added to facility.` });
      }
      setModalOpen(false);
      loadServices();
    } catch (err: any) {
      showToast({ type: 'warning', title: 'Error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/admin" className="hover:text-white">Admin</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-medium">Services</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Facility Services</h1>
          <p className="text-xs text-slate-400">
            Configure service queues, target service times, and counter assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Facility Filter */}
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Services Table */}
      {isLoading ? (
        <LoadingSpinner message="Loading services..." />
      ) : services.length > 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Service Name</th>
                  <th className="px-5 py-3.5">Target Average Service Time</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white">{s.name}</td>
                    <td className="px-5 py-3.5 font-medium text-cyan-300">
                      ~{s.average_service_time_minutes} minutes / token
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 max-w-sm truncate">
                      {s.description || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
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
          title="No Services Found"
          description="This location has no services yet. Click Add Service to register one."
          actionText="Add Service"
          onAction={openCreateModal}
        />
      )}

      {/* Modal: Create/Edit Service */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 max-w-md w-full relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingService ? 'Edit Service' : 'Add Service'}
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
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Blood Test & Pathology"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Service Time (Minutes) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={avgTime}
                  onChange={(e) => setAvgTime(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Service intake guidelines..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
