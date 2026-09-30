import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/Common';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { LocationsPage } from './pages/LocationsPage';
import { LocationDetailPage } from './pages/LocationDetailPage';
import { JoinQueuePage } from './pages/JoinQueuePage';
import { TokenDetailPage } from './pages/TokenDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { OperatorConsolePage } from './pages/OperatorConsolePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLocationsPage } from './pages/AdminLocationsPage';
import { AdminServicesPage } from './pages/AdminServicesPage';
import { AdminCountersPage } from './pages/AdminCountersPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { SuperadminPage } from './pages/SuperadminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/locations" element={<LocationsPage />} />
                    <Route path="/locations/:locationId" element={<LocationDetailPage />} />
                    <Route path="/join/:serviceId" element={<JoinQueuePage />} />
                    <Route path="/token/:tokenId" element={<TokenDetailPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Citizen Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['citizen']}>
                          <CitizenDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute>
                          <NotificationsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Operator Console */}
                    <Route
                      path="/operator"
                      element={
                        <ProtectedRoute allowedRoles={['operator', 'admin', 'superadmin']}>
                          <OperatorConsolePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                          <AdminDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/locations"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                          <AdminLocationsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/services"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                          <AdminServicesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/counters"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                          <AdminCountersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/analytics"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                          <AdminAnalyticsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Superadmin Route */}
                    <Route
                      path="/superadmin"
                      element={
                        <ProtectedRoute allowedRoles={['superadmin']}>
                          <SuperadminPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
