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
    <div className="min-h-screen bg-gradient-to-b from-forest-50 via-white to-canvas">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Logo />
        <Link
          to="/login"
          className="text-sm font-medium text-ink-soft hover:text-ink"
          data-testid="nav-login"
        >
          Log in
        </Link>
      </nav>

      <main className="mx-auto max-w-5xl px-4 pb-20">
        <section className="py-12 text-center sm:py-20">
          <p className="mb-3 inline-block rounded-full bg-forest-100 px-3 py-1 text-xs font-medium text-forest">
            Online booking for small businesses
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Let clients book themselves.{' '}
            <span className="text-forest">Run your day from one agenda.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">
            BookFlow helps barbershops, clinics, gyms and studios manage services, staff,
            appointments and clients — with a public booking page that works on any phone.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={`/book/${DEMO_SLUG}`}
              data-testid="cta-book-demo"
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-3 font-medium text-white shadow-soft hover:bg-forest"
            >
              Try the booking page <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/login"
              data-testid="cta-admin-demo"
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white px-5 py-3 font-medium text-ink-soft shadow-soft hover:bg-canvas"
            >
              Open the admin panel
            </Link>
          </div>
          <div
            className="mx-auto mt-6 max-w-md rounded-lg border border-line bg-white/70 p-4 text-left text-sm text-ink-soft"
            data-testid="demo-credentials"
          >
            <p className="mb-1 font-medium text-ink">Demo accounts</p>
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
            <div key={title} className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <Icon className="mb-3 size-6 text-forest" aria-hidden />
              <h2 className="font-semibold text-ink">{title}</h2>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center text-sm text-muted">
        Built by{' '}
        <a
          href="https://github.com/lucaswsanchez"
          className="font-medium text-ink-soft hover:underline"
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
