import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../../../shared/schemas';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (user.role === 'superadmin') {
      return <>{children}</>;
    }
    if (!allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-rose-500/30">
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-xs text-slate-400 mb-6">
              Your role (<strong>{user.role}</strong>) does not have authorization to view this
              control panel.
            </p>
            <Navigate to="/" replace />
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
