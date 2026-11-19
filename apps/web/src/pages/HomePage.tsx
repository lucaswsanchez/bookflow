import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui';

export const DEMO_SLUG = 'barberia-costanera';

const PROBLEMS = [
  {
    label: 'Messages',
    text: 'Bookings arrive over WhatsApp, Instagram and phone calls, at any hour, and someone has to answer each one.',
  },
  {
    label: 'Overlaps',
    text: 'Two people book the same chair because the agenda lives in a notebook or in somebody’s head.',
  },
  {
    label: 'Blind spots',
    text: 'Nobody knows how full the week is, which services sell, or how much the day brought in.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Set up your business',
    text: 'Add services with duration and price, your team and each person’s working hours.',
  },
  {
    n: '02',
    title: 'Share your booking link',
    text: 'Clients pick a service, professional, day and time from their phone. No account required.',
  },
  {
    n: '03',
    title: 'Run the day from the agenda',
    text: 'See every appointment, mark them completed or no-show, and follow revenue and occupancy.',
  },
];

const FEATURES = [
  {
    tag: 'Availability',
    title: 'Real free slots, calculated on the server',
    text: 'Times come from working hours, service duration and existing bookings. The client never guesses.',
  },
  {
    tag: 'Integrity',
    title: 'Double booking is impossible',
    text: 'A PostgreSQL exclusion constraint rejects overlapping appointments for the same professional, even under concurrent requests.',
  },
  {
    tag: 'Agenda',
    title: 'Day and week views for the whole team',
    text: 'Filter by professional, see off hours and the current time, open any appointment to change its status.',
  },
  {
    tag: 'Roles',
    title: 'Owners manage, staff see their own day',
    text: 'Admins handle services, staff, clients and reports. Each professional only sees their own agenda.',
  },
  {
    tag: 'Reports',
    title: 'Revenue, occupancy and top services',
    text: 'Per day, per professional and per service, with CSV export for your accountant.',
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

function Screen({
  src,
  alt,
  width,
  height,
  className,
  eager,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  eager?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      className={`block h-auto w-full ${className ?? ''}`}
    />
  );
}

const h2 = 'text-[30px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[38px]';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero: dark, two columns, real product on the right */}
      <div className="overflow-hidden bg-night text-night-text">
        <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-5 sm:px-6">
          <Logo inverted />
          <div className="flex items-center gap-5 text-[13px]">
            <a
              href="https://github.com/lucaswsanchez/bookflow"
              className="hidden text-night-muted hover:text-white sm:inline"
            >
              GitHub
            </a>
            <Link
              to="/login"
              className="font-medium text-white hover:text-accent-100"
              data-testid="nav-login"
            >
              Log in
            </Link>
          </div>
        </nav>

        <section className="mx-auto grid max-w-[1200px] gap-12 px-4 pt-10 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:gap-12 lg:pt-16">
          <div className="lg:pt-10 lg:pb-24">
            <p className="eyebrow mb-5 text-signal">Scheduling for service businesses</p>
            <h1 className="text-[40px] leading-[1.02] font-semibold tracking-[-0.04em] text-white sm:text-[56px]">
              Every booking,
              <br />
              one calm agenda.
            </h1>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-night-muted">
              BookFlow gives your clients a booking page that works on any phone, and gives your
              team one agenda with real availability, statuses, revenue and occupancy.
            </p>
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <Link
                to={`/book/${DEMO_SLUG}`}
                data-testid="cta-book-demo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent-strong px-5 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] transition-colors hover:bg-accent-deep"
              >
                Try booking <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                to="/login?demo=admin"
                data-testid="cta-admin-demo"
                className="inline-flex h-11 items-center justify-center rounded-md border border-night-line bg-night-2 px-5 text-[15px] font-medium text-white transition-colors hover:bg-night-3"
              >
                Explore the platform
              </Link>
            </div>
          </div>

          {/* Real capture of the admin overview, bleeding off the right edge on desktop */}
          <figure className="relative lg:-mr-[max(0px,calc((100vw-1200px)/2))] lg:self-end">
            <div className="overflow-hidden rounded-t-xl border border-b-0 border-night-line bg-night-2 p-1.5 pb-0 lg:rounded-tr-none lg:border-r-0 lg:p-2 lg:pb-0">
              <Screen
                src="/screens/overview-crop.jpg"
                alt="BookFlow overview with today's revenue, a timeline of today's appointments per professional and the next bookings"
                width={1812}
                height={1020}
                className="rounded-t-lg lg:rounded-tr-none"
                eager
              />
            </div>
          </figure>
        </section>
      </div>

      {/* Live demo strip: real seed data, one click into each role */}
      <section className="border-b border-line bg-canvas" aria-label="Live demo">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[14px] text-ink-soft">
            <span className="mr-2 inline-flex items-center gap-1.5 font-medium text-ink">
              <span className="size-1.5 rounded-full bg-success" aria-hidden /> Live demo
            </span>
            A sample barbershop in Corrientes with demo data, ready to explore.
          </p>
          <dl
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]"
            data-testid="demo-credentials"
          >
            <div className="flex items-center gap-2">
              <dt className="text-muted">Admin</dt>
              <dd className="mono text-ink-soft">admin@demo.com · Admin123!</dd>
              <dd>
                <Link
                  to="/login?demo=admin"
                  className="font-medium text-accent-ink hover:underline"
                >
                  Open
                </Link>
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-muted">Staff</dt>
              <dd className="mono text-ink-soft">staff@demo.com · Staff123!</dd>
              <dd>
                <Link
                  to="/login?demo=staff"
                  className="font-medium text-accent-ink hover:underline"
                >
                  Open
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <main>
        {/* Problem */}
        <section className="mx-auto grid max-w-[1200px] gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <p className="eyebrow mb-4">The problem</p>
            <h2 className={`max-w-md ${h2}`}>
              Small businesses lose hours a week just booking appointments.
            </h2>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {PROBLEMS.map((p) => (
              <li key={p.label} className="grid gap-2 py-6 sm:grid-cols-[160px_1fr] sm:gap-8">
                <span className="mono text-[13px] text-muted">{p.label}</span>
                <p className="text-[17px] leading-relaxed text-ink-soft">{p.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="border-y border-line bg-canvas" aria-labelledby="how-title">
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
            <p className="eyebrow mb-4">How it works</p>
            <h2 id="how-title" className={`mb-12 ${h2}`}>
              Three steps, then it runs itself.
            </h2>
            <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((s) => (
                <li key={s.n} className="border-t-2 border-ink pt-5">
                  <span className="mono text-[13px] text-accent-ink">{s.n}</span>
                  <h3 className="mt-3 text-[19px] font-semibold tracking-[-0.02em]">{s.title}</h3>
                  <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-soft">
                    {s.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features: sticky heading on the left, ruled list on the right */}
        <section
          className="mx-auto grid max-w-[1200px] gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
          aria-labelledby="features-title"
        >
          <div className="lg:sticky lg:top-10 lg:self-start">
            <p className="eyebrow mb-4">What’s inside</p>
            <h2 id="features-title" className={`max-w-md ${h2}`}>
              Everything a booking business needs, nothing it doesn’t.
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
              A booking page for clients and a workspace for the team. Every number on screen comes
              from real bookings: no spreadsheets, no manual counting.
            </p>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            {FEATURES.map((f) => (
              <div key={f.tag} className="grid gap-2 py-7 sm:grid-cols-[160px_1fr] sm:gap-8">
                <dt className="mono text-[13px] text-accent-ink">{f.tag}</dt>
                <dd>
                  <p className="text-[19px] font-semibold tracking-[-0.02em]">{f.title}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{f.text}</p>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Screens */}
        <section className="bg-night text-night-text" aria-labelledby="screens-title">
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-24">
            <p className="eyebrow mb-4 text-signal">The screens</p>
            <h2 id="screens-title" className={`max-w-xl text-white ${h2}`}>
              A workspace for the team, a booking page for clients.
            </h2>
            <div className="mt-12 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
              <figure className="min-w-0">
                <div className="overflow-hidden rounded-xl border border-night-line bg-night-2 p-1.5">
                  <Screen
                    src="/screens/agenda.jpg"
                    alt="BookFlow agenda, day view with one column per professional"
                    width={2160}
                    height={1350}
                    className="rounded-lg"
                  />
                </div>
                <figcaption className="mt-3 text-[13px] text-night-muted">
                  <span className="mono text-white">Agenda</span> · day and week views, one column
                  per professional
                </figcaption>
              </figure>
              <figure className="mx-auto w-full max-w-[280px]">
                <div className="overflow-hidden rounded-[22px] border border-night-line bg-night-2 p-1.5">
                  <Screen
                    src="/screens/booking.jpg"
                    alt="BookFlow public booking page on a phone, choosing a day and time"
                    width={585}
                    height={1266}
                    className="rounded-[16px]"
                  />
                </div>
                <figcaption className="mt-3 text-[13px] text-night-muted">
                  <span className="mono text-white">Booking</span> · times come from the server
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6" aria-labelledby="for-title">
          <p id="for-title" className="eyebrow mb-6">
            Made for businesses that work by appointment
          </p>
          <ul className="flex flex-wrap gap-x-3 gap-y-2 text-[26px] leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[36px]">
            {INDUSTRIES.map((i, idx) => (
              <li key={i} className="flex items-center gap-3">
                {i}
                {idx < INDUSTRIES.length - 1 && (
                  <span className="text-line-strong" aria-hidden>
                    /
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-accent-strong px-6 py-10 text-white sm:px-10 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-[26px] leading-tight font-semibold tracking-[-0.03em] sm:text-[30px]">
                See it with real data.
              </h2>
              <p className="mt-2 text-[15px] text-accent-100">
                Book an appointment as a client, then find it in the agenda as the owner.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
              <Link
                to={`/book/${DEMO_SLUG}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-[15px] font-medium text-ink hover:bg-accent-50"
              >
                Try booking <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                to="/login?demo=admin"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/30 px-5 text-[15px] font-medium text-white hover:bg-white/10"
              >
                Open the admin demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-3 px-4 py-6 text-[13px] text-muted sm:flex-row sm:items-center sm:px-6">
          <Logo className="text-[14px]" />
          <p>
            Built by{' '}
            <a
              href="https://github.com/lucaswsanchez"
              className="font-medium text-ink-soft hover:text-accent-ink"
            >
              Lucas Sanchez
            </a>{' '}
            ·{' '}
            <a
              href="https://github.com/lucaswsanchez/bookflow"
              className="inline-flex items-center gap-0.5 hover:text-accent-ink"
            >
              Source on GitHub <ArrowUpRight className="size-3" aria-hidden />
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
