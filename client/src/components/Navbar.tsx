import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Layers,
  Bell,
  User,
  LogOut,
  Sparkles,
  MapPin,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { UserRole } from '../../../shared/schemas';

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const { unreadCount, requestBrowserPermission, browserNotificationsEnabled } = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSwitch = async (role: UserRole) => {
    setDemoMenuOpen(false);
    await demoLogin(role);
    if (role === 'operator') navigate('/operator');
    else if (role === 'admin') navigate('/admin');
    else if (role === 'superadmin') navigate('/superadmin');
    else navigate('/dashboard');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Queue<span className="text-indigo-400">Less</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI Smart Queue
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/locations"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/locations')
                  ? 'text-white bg-slate-800/80'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                Browse Facilities
              </span>
            </Link>

            {user?.role === 'citizen' && (
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'text-white bg-slate-800/80'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  My Tokens
                </span>
              </Link>
            )}

            {['operator', 'admin', 'superadmin'].includes(user?.role || '') && (
              <Link
                to="/operator"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/operator')
                    ? 'text-white bg-slate-800/80'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                  Operator Console
                </span>
              </Link>
            )}

            {['admin', 'superadmin'].includes(user?.role || '') && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'text-white bg-slate-800/80'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Admin
                </span>
              </Link>
            )}

            {user?.role === 'superadmin' && (
              <Link
                to="/superadmin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/superadmin')
                    ? 'text-white bg-slate-800/80'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Superadmin
                </span>
              </Link>
            )}
          </div>

          {/* Right Controls: Demo Switcher + Notifications + User Menu */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/50 hover:border-indigo-400 transition-colors"
                title="Switch test persona instantly"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Role:</span>
                <span className="capitalize font-semibold text-white">
                  {user ? user.role : 'Guest'}
                </span>
                <ChevronDown className="w-3 h-3 ml-0.5 text-indigo-400" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-1.5 z-50 backdrop-blur-xl">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch Test Account
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('citizen')}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200"
                  >
                    <span>Citizen (Alex Rivera)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      User
                    </span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('operator')}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200"
                  >
                    <span>Operator (Marcus Vance)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Staff
                    </span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200"
                  >
                    <span>Admin (Dr. Sarah Mitchell)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      Manager
                    </span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('superadmin')}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200"
                  >
                    <span>Superadmin (Elena Rostova)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Full
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            {user && (
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Account / Login */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs font-medium text-slate-200 hover:border-slate-600 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                    {user.full_name[0]}
                  </div>
                  <span className="max-w-[120px] truncate">{user.full_name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 px-4 pt-3 pb-5 space-y-2 bg-slate-950/95 backdrop-blur-xl">
          <Link
            to="/locations"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Browse Facilities
          </Link>
          {user?.role === 'citizen' && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
            >
              My Tokens & Queue History
            </Link>
          )}
          {['operator', 'admin', 'superadmin'].includes(user?.role || '') && (
            <Link
              to="/operator"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
            >
              Operator Console
            </Link>
          )}
          {['admin', 'superadmin'].includes(user?.role || '') && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
            >
              Admin Dashboard
            </Link>
          )}
          {user?.role === 'superadmin' && (
            <Link
              to="/superadmin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
            >
              Superadmin Overview
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
