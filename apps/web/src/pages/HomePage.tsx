import { ArrowRight, CalendarClock, LayoutDashboard, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui';

export const DEMO_SLUG = 'barberia-costanera';

const FEATURES = [
  {
    icon: CalendarClock,
    title: 'Real-time availability',
    text: 'Slots are calculated on the server from working hours, service length and existing bookings — no double bookings.',
  },
  {
    icon: LayoutDashboard,
    title: 'Agenda & dashboard',
    text: 'Day and week views, status tracking and estimated revenue at a glance.',
  },
  {
    icon: Users,
    title: 'Services, staff & clients',
    text: 'Manage what you offer, who offers it, weekly schedules and your client list.',
  },
  {
    icon: ShieldCheck,
    title: 'Roles & security',
    text: 'JWT auth with refresh tokens. Staff members only see their own agenda.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-slate-50">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Logo />
        <Link
          to="/login"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
          data-testid="nav-login"
        >
          Log in
        </Link>
      </nav>

      <main className="mx-auto max-w-5xl px-4 pb-20">
        <section className="py-12 text-center sm:py-20">
          <p className="mb-3 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
            Online booking for small businesses
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Let clients book themselves.{' '}
            <span className="text-brand-600">Run your day from one agenda.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            BookFlow helps barbershops, clinics, gyms and studios manage services, staff,
            appointments and clients — with a public booking page that works on any phone.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={`/book/${DEMO_SLUG}`}
              data-testid="cta-book-demo"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-brand-700"
            >
              Try the booking page <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/login"
              data-testid="cta-admin-demo"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Open the admin panel
            </Link>
          </div>
          <div
            className="mx-auto mt-6 max-w-md rounded-xl border border-slate-200 bg-white/70 p-4 text-left text-sm text-slate-600"
            data-testid="demo-credentials"
          >
            <p className="mb-1 font-medium text-slate-800">Demo accounts</p>
            <p>
              Admin: <code className="font-mono">admin@demo.com</code> /{' '}
              <code className="font-mono">Admin123!</code>
            </p>
            <p>
              Staff: <code className="font-mono">staff@demo.com</code> /{' '}
              <code className="font-mono">Staff123!</code>
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2" aria-label="Features">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="mb-3 size-6 text-brand-600" aria-hidden />
              <h2 className="font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        Built by{' '}
        <a
          href="https://github.com/lucaswsanchez"
          className="font-medium text-slate-700 hover:underline"
        >
          Lucas Sanchez
        </a>{' '}
        ·{' '}
        <a href="https://github.com/lucaswsanchez/bookflow" className="hover:underline">
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}
