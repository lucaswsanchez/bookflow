import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { ApiError } from './lib/api';
import AdminLayout from './pages/admin/AdminLayout';
import AgendaPage from './pages/admin/AgendaPage';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import ClientsPage from './pages/admin/ClientsPage';
import DashboardPage from './pages/admin/DashboardPage';
import ServicesPage from './pages/admin/ServicesPage';
import StaffPage from './pages/admin/StaffPage';
import UiShowcasePage from './pages/admin/UiShowcasePage';
import BookingPage from './pages/booking/BookingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { Spinner } from './components/ui';

// Charts are only needed on the reports page: keep Recharts out of the main bundle.
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Don't retry client errors (4xx); retry network/server errors once.
      retry: (count, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
    },
  },
});

function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-3 font-display text-5xl text-forest">Page not found</h1>
        <p className="mt-3 text-sm text-muted">The page you are looking for doesn’t exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold hover:bg-subtle"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/book/:slug" element={<BookingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route
                path="reports"
                element={
                  <RequireAuth roles={['ADMIN']}>
                    <Suspense fallback={<Spinner label="Loading reports…" />}>
                      <ReportsPage />
                    </Suspense>
                  </RequireAuth>
                }
              />
              <Route path="ui" element={<UiShowcasePage />} />
              <Route
                path="services"
                element={
                  <RequireAuth roles={['ADMIN']}>
                    <ServicesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="staff"
                element={
                  <RequireAuth roles={['ADMIN']}>
                    <StaffPage />
                  </RequireAuth>
                }
              />
              <Route
                path="clients"
                element={
                  <RequireAuth roles={['ADMIN']}>
                    <ClientsPage />
                  </RequireAuth>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
