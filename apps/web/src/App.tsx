import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { ApiError } from './lib/api';
import AdminLayout from './pages/admin/AdminLayout';
import AgendaPage from './pages/admin/AgendaPage';
import ClientsPage from './pages/admin/ClientsPage';
import DashboardPage from './pages/admin/DashboardPage';
import ServicesPage from './pages/admin/ServicesPage';
import StaffPage from './pages/admin/StaffPage';
import BookingPage from './pages/booking/BookingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

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
        <p className="text-sm font-semibold text-brand-600">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
        <Link to="/" className="mt-4 inline-block text-brand-700 hover:underline">
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
