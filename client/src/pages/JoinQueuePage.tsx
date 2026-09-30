import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Service, Counter, AIWaitPredictionResponse } from '../../../shared/schemas';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { LoadingSpinner } from '../components/Common';
import {
  Sparkles,
  Clock,
  Users,
  Building,
  User as UserIcon,
  Phone,
  Mail,
  FileText,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

export const JoinQueuePage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [service, setService] = useState<Service | null>(null);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [prediction, setPrediction] = useState<AIWaitPredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [preferredCounter, setPreferredCounter] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Update pre-fill if user state resolves
  useEffect(() => {
    if (user) {
      if (!name) setName(user.full_name);
      if (!phone && user.phone) setPhone(user.phone);
      if (!email) setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    async function loadServiceAndPrediction() {
      if (!serviceId) return;
      setIsLoading(true);
      try {
        const countersData = await api.counters.getByService(serviceId);
        setCounters(countersData);

        // Fetch AI prediction
        const aiPred = await api.ai.predictWait(serviceId);
        setPrediction(aiPred);
      } catch (err: any) {
        setError(err.message || 'Failed to load service');
      } finally {
        setIsLoading(false);
      }
    }
    loadServiceAndPrediction();
  }, [serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) return;

    if (!name.trim()) {
      showToast({ type: 'warning', title: 'Name Required', message: 'Please enter your full name.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newToken = await api.tokens.join({
        service_id: serviceId,
        citizen_name: name.trim(),
        citizen_phone: phone.trim() || undefined,
        citizen_email: email.trim() || undefined,
        counter_id: preferredCounter || undefined,
        notes: notes.trim() || undefined,
      });

      showToast({
        type: 'success',
        title: `Token Issued: ${newToken.token_number}`,
        message: 'You have successfully joined the digital queue!',
      });

      navigate(`/token/${newToken.id}`);
    } catch (err: any) {
      console.error('Failed to join queue:', err);
      showToast({
        type: 'warning',
        title: 'Queue Join Failed',
        message: err.message || 'Could not issue token. Please check details.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Calculating queue position and wait time..." />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Facility</span>
      </button>

      {/* Main Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Digital Token Issuance</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Join Service Queue
          </h1>

          <p className="text-xs text-slate-400">
            Secure your digital token now. You will receive live position tracking and notification alerts when your turn is close.
          </p>
        </div>

        {/* AI Prediction Preview Box */}
        {prediction && (
          <div className="mb-8 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400">
                Gemini Predictive AI Estimate
              </span>
              <p className="text-xs text-slate-200">{prediction.message}</p>
              <p className="text-[11px] text-cyan-300 font-semibold">
                Suggested: {prediction.suggestedArrivalWindow}
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="text-2xl font-black text-white font-mono">
                ~{prediction.estimatedWaitMinutes} min
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {prediction.confidence}% confidence
              </span>
            </div>
          </div>
        )}

        {/* Join Queue Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Citizen Full Name *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number (for SMS alerts)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address (for notification receipts)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {counters.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Preferred Counter (Optional)
              </label>
              <select
                value={preferredCounter}
                onChange={(e) => setPreferredCounter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Any Available Counter (Fastest)</option>
                {counters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_open ? '(Open)' : '(Closed)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Service Purpose / Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., Routine blood checkup, mortgage consultation, license renewal..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Generating Token...</span>
              ) : (
                <>
                  <span>Issue My Digital Token</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
