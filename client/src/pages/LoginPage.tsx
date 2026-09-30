import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Layers,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  User,
  LayoutDashboard,
} from 'lucide-react';
import { UserRole } from '../../../shared/schemas';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ email, password });
      showToast({ type: 'success', title: 'Welcome Back!', message: 'Logged in successfully.' });
      navigate(from, { replace: true });
    } catch (err: any) {
      showToast({
        type: 'warning',
        title: 'Login Failed',
        message: err.message || 'Invalid email or password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemo = async (role: UserRole) => {
    try {
      await demoLogin(role);
      showToast({
        type: 'success',
        title: `Switched to ${role.toUpperCase()}`,
        message: 'Signed in with demo credentials.',
      });
      if (role === 'operator') navigate('/operator');
      else if (role === 'admin') navigate('/admin');
      else if (role === 'superadmin') navigate('/superadmin');
      else navigate('/dashboard');
    } catch (err: any) {
      showToast({ type: 'warning', title: 'Demo Login Failed', message: err.message });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sign In to QueueLess</h1>
          <p className="text-xs text-slate-400">
            Access your live queue tokens, operator desk, or facility console.
          </p>
        </div>

        {/* Demo Fast Logins Banner */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Instant One-Click Test Accounts</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('citizen')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 justify-center transition-colors"
            >
              <User className="w-3 h-3 text-blue-400" />
              <span>Alex (Citizen)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('operator')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 justify-center transition-colors"
            >
              <LayoutDashboard className="w-3 h-3 text-emerald-400" />
              <span>Marcus (Desk)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 justify-center transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>Dr. Sarah (Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('superadmin')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 justify-center transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Elena (Superadmin)</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
