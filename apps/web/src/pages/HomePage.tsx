import { ArrowRight, CalendarClock, LayoutGrid, ShieldCheck, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui';

export const DEMO_SLUG = 'barberia-costanera';

const FEATURES = [
  {
    icon: Smartphone,
    title: 'A booking page clients actually finish',
    text: 'Service, professional, day, time, details. Built for phones, no account required.',
  },
  {
    icon: CalendarClock,
    title: 'Real availability, never double-booked',
    text: 'Free slots are calculated on the server from working hours and existing bookings, and the database rejects overlaps.',
  },
  {
    icon: LayoutGrid,
    title: 'One agenda for the whole team',
    text: 'Day and week views, status tracking, revenue, occupancy and simple reports.',
  },
  {
    icon: ShieldCheck,
    title: 'Roles that match how you work',
    text: 'Owners manage everything. Each professional only sees their own agenda.',
  },
];

const INDUSTRIES = [
  'Barbershops',
  'Hair salons',
  'Medical practices',
  'Physiotherapists',
  'Tattoo studios',
  'Beauty centers',
  'Personal trainers',
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Link
          to="/login"
          className="text-sm font-semibold text-ink-soft hover:text-forest"
          data-testid="nav-login"
        >
          Log in
        </Link>
      </nav>

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-14 pb-20 sm:px-6 sm:pt-24">
          <p className="eyebrow mb-5 text-moss">Online booking for small businesses</p>
          <h1 className="max-w-4xl font-display text-[44px] leading-[1.02] text-forest sm:text-[72px]">
            Stop booking appointments over WhatsApp.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            BookFlow gives your clients a booking page that works on any phone, and gives you one
            agenda for services, staff, clients and revenue.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to={`/book/${DEMO_SLUG}`}
              data-testid="cta-book-demo"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-forest px-6 font-semibold text-white shadow-soft transition-colors hover:bg-forest-deep"
            >
              Try the booking page <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/login"
              data-testid="cta-admin-demo"
              className="inline-flex h-12 items-center justify-center rounded-md border border-line-strong bg-surface px-6 font-semibold text-ink transition-colors hover:bg-subtle"
            >
              Open the admin panel
            </Link>
          </div>

          <dl
            className="mt-8 inline-grid grid-cols-[auto_auto] gap-x-6 gap-y-1 rounded-md border border-dashed border-line-strong px-4 py-3 text-[13px]"
            data-testid="demo-credentials"
          >
            <dt className="eyebrow col-span-2 mb-1">Demo accounts</dt>
            <dt className="font-semibold">Admin</dt>
            <dd className="text-ink-soft">
              <code className="font-mono">admin@demo.com</code> ·{' '}
              <code className="font-mono">Admin123!</code>
            </dd>
            <dt className="font-semibold">Staff</dt>
            <dd className="text-ink-soft">
              <code className="font-mono">staff@demo.com</code> ·{' '}
              <code className="font-mono">Staff123!</code>
            </dd>
          </dl>

          {/* Real screenshot of the admin overview with demo data */}
          <figure className="mt-16 overflow-hidden rounded-xl border border-line bg-surface shadow-pop sm:mt-20">
            <div
              className="flex items-center gap-1.5 border-b border-line bg-subtle px-4 py-2.5"
              aria-hidden
            >
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="ml-3 truncate rounded-sm bg-surface px-2 py-0.5 text-[11px] text-muted">
                bookflow / overview
              </span>
            </div>
            <img
              src="/preview-overview.jpg"
              alt="BookFlow admin overview: revenue, next appointments, status and occupancy per professional"
              width={2160}
              height={1350}
              loading="lazy"
              className="block h-auto w-full"
            />
          </figure>
        </section>

        <section className="border-y border-line bg-surface" aria-label="Made for">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-6 sm:px-6">
            <p className="eyebrow">Made for</p>
            {INDUSTRIES.map((i) => (
              <span key={i} className="text-[15px] font-semibold text-ink-soft">
                {i}
              </span>
            ))}
          </div>
        </section>

        <section
          className="mx-auto grid max-w-6xl gap-px px-4 py-20 sm:grid-cols-2 sm:px-6"
          aria-label="Features"
        >
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <div
              key={title}
              className={`border-line py-8 sm:px-8 ${i % 2 === 0 ? 'sm:border-r sm:pl-0' : 'sm:pr-0'} ${i < 2 ? 'border-b' : 'border-b sm:border-b-0'}`}
            >
              <Icon className="size-5 text-moss" aria-hidden />
              <h2 className="mt-4 text-lg font-bold tracking-tight">{title}</h2>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-soft">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line py-8 text-center text-[13px] text-muted">
        Built by{' '}
        <a
          href="https://github.com/lucaswsanchez"
          className="font-semibold text-ink-soft hover:text-forest"
        >
          Lucas Sanchez
        </a>{' '}
        ·{' '}
        <a href="https://github.com/lucaswsanchez/bookflow" className="hover:text-forest">
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}
