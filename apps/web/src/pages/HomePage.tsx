import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarX2,
  ChartColumn,
  Dumbbell,
  EyeOff,
  Flower2,
  Link2,
  MessageSquareText,
  PenTool,
  Scissors,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui';
import { API_URL } from '../lib/api';

export const DEMO_SLUG = 'barberia-costanera';

const PAIRS: {
  label: string;
  icon: LucideIcon;
  problem: string;
  fixIcon: LucideIcon;
  fix: string;
  fixText: string;
}[] = [
  {
    label: 'Messages',
    icon: MessageSquareText,
    problem: 'Bookings arrive over WhatsApp, Instagram and phone calls, at any hour.',
    fixIcon: Link2,
    fix: 'A booking link that answers for you',
    fixText: 'Clients pick a service, a professional and a time on their own, with no account.',
  },
  {
    label: 'Overlaps',
    icon: CalendarX2,
    problem: 'Two people end up booked on the same chair at the same time.',
    fixIcon: ShieldCheck,
    fix: 'The database refuses double bookings',
    fixText: 'Free times are calculated on the server, and PostgreSQL rejects any overlap.',
  },
  {
    label: 'Blind spots',
    icon: EyeOff,
    problem: 'Nobody knows how full the week is or how much the day brought in.',
    fixIcon: ChartColumn,
    fix: 'Revenue and occupancy, always current',
    fixText: 'Every number comes from real appointments: per day, professional and service.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Set up your business',
    text: 'Add services with duration and price, your team and each person’s working hours.',
    where: 'Admin · Services',
  },
  {
    n: '02',
    title: 'Share your booking link',
    text: 'Clients pick a service, professional, day and time from their phone. No account required.',
    where: 'Client · Booking page',
  },
  {
    n: '03',
    title: 'Run the day from the agenda',
    text: 'See every appointment, mark them completed or no-show, and follow revenue and occupancy.',
    where: 'Admin · Overview',
  },
];

/** Menus as they appear in the app sidebar for each role. */
const ROLE_MENUS = {
  Admin: [
    'Overview',
    'Agenda',
    'Appointments',
    'Reports',
    'Services',
    'Staff',
    'Clients',
    'Settings',
  ],
  Staff: ['Overview', 'Agenda', 'Appointments'],
};

const STACK = [
  'NestJS',
  'Prisma',
  'PostgreSQL',
  'React 19',
  'TypeScript',
  'Tailwind CSS 4',
  'TanStack Query',
  'Zod',
  'Jest · Vitest',
  'GitHub Actions',
  'Docker',
];

const FACTS = [
  { value: '96', label: 'automated tests', detail: '37 unit · 33 e2e on PostgreSQL · 26 web' },
  { value: '32', label: 'REST endpoints', detail: 'Documented with Swagger / OpenAPI' },
  { value: '97%', label: 'line coverage', detail: 'of the availability engine' },
  {
    value: '2',
    label: 'roles enforced by the API',
    detail: 'Admin and staff, checked on every request',
  },
];

const INDUSTRIES: { name: string; text: string; icon: LucideIcon }[] = [
  { name: 'Barbershops', text: 'Cuts, beard trims and shaves', icon: Scissors },
  { name: 'Hair salons', text: 'Color, styling and treatments', icon: Sparkles },
  { name: 'Medical practices', text: 'Consultations and check-ups', icon: Stethoscope },
  { name: 'Physiotherapists', text: 'Sessions with each professional', icon: Activity },
  { name: 'Tattoo studios', text: 'Long sessions per artist', icon: PenTool },
  { name: 'Beauty centers', text: 'Facials, nails and waxing', icon: Flower2 },
  { name: 'Personal trainers', text: 'One-on-one training sessions', icon: Dumbbell },
];

/** The exclusion constraint from apps/api/prisma/migrations/20261117000000_init, tokenized for display. */
type Tok = [text: string, kind?: 'kw' | 'str' | 'id' | 'op' | 'cm'];
const SQL: Tok[][] = [
  [['-- One professional, one appointment at a time', 'cm']],
  [['ALTER TABLE', 'kw'], [' '], ['"Appointment"', 'id']],
  [['  ADD CONSTRAINT', 'kw'], [' '], ['"Appointment_no_overlap"', 'id']],
  [['  EXCLUDE USING', 'kw'], [' gist (']],
  [
    ['    "staffId"', 'id'],
    [' extensions.gist_text_ops '],
    ['WITH', 'kw'],
    [' '],
    ['=', 'op'],
    [','],
  ],
  [
    ['    tstzrange('],
    ['"startsAt"', 'id'],
    [', '],
    ['"endsAt"', 'id'],
    [', '],
    ["'[)'", 'str'],
    [') '],
    ['WITH', 'kw'],
    [' '],
    ['&&', 'op'],
  ],
  [['  ) '], ['WHERE', 'kw'], [' (status '], ['<>', 'op'], [' '], ["'CANCELLED'", 'str'], [');']],
];
const TOK_CLASS = {
  kw: 'text-[#8fa3ff]',
  str: 'text-signal',
  id: 'text-white',
  op: 'text-[#ff9b8a]',
  cm: 'text-night-muted italic',
};

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
        {/* Problem → how BookFlow solves it, one row per pain point */}
        <section
          className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28"
          aria-labelledby="problem-title"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
            <div>
              <p className="eyebrow mb-4">The problem</p>
              <h2 id="problem-title" className={`max-w-md ${h2}`}>
                Booking by message doesn’t scale.
              </h2>
            </div>
            <p className="max-w-lg self-end text-[16px] leading-relaxed text-ink-soft">
              When the agenda lives in a chat or a notebook, the same three things go wrong.
              BookFlow fixes each one at the source.
            </p>
          </div>

          <ul className="mt-12 overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
            {PAIRS.map((p) => (
              <li
                key={p.label}
                className="grid border-b border-line last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]"
              >
                <div className="flex gap-4 bg-canvas px-5 py-6 sm:px-7 md:border-r md:border-line">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-faint">
                    <p.icon className="size-[18px]" aria-hidden />
                  </span>
                  <div>
                    <p className="mono text-[12px] text-muted uppercase">{p.label}</p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{p.problem}</p>
                  </div>
                </div>
                <div className="relative flex gap-4 px-5 py-6 sm:px-7">
                  <span
                    className="absolute top-1/2 -left-3 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-accent-ink md:flex"
                    aria-hidden
                  >
                    <ArrowRight className="size-3.5" />
                  </span>
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-ink">
                    <p.fixIcon className="size-[18px]" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[17px] font-semibold tracking-[-0.02em]">{p.fix}</p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{p.fixText}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works: each step with the real screen it happens on */}
        <section className="border-y border-line bg-canvas" aria-labelledby="how-title">
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-24">
            <p className="eyebrow mb-4">How it works</p>
            <h2 id="how-title" className={`mb-12 ${h2}`}>
              Three steps, then it runs itself.
            </h2>
            <ol className="relative grid gap-12 md:grid-cols-3 md:gap-6">
              {/* Journey line behind the step numbers (desktop) */}
              <span
                className="absolute top-4 right-[16%] left-4 hidden h-px bg-line-strong md:block"
                aria-hidden
              />
              {STEPS.map((s, i) => (
                <li key={s.n} className="relative flex flex-col">
                  <span className="mono relative flex size-8 items-center justify-center rounded-full bg-night text-[12px] font-medium text-white ring-4 ring-canvas">
                    {s.n}
                  </span>
                  <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.02em]">{s.title}</h3>
                  <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-soft">
                    {s.text}
                  </p>
                  <figure className="mt-6 flex flex-1 flex-col">
                    <div className="relative h-52 overflow-hidden rounded-lg border border-line bg-surface shadow-soft">
                      {i === 1 ? (
                        <div className="absolute inset-x-0 top-4 mx-auto w-[168px] overflow-hidden rounded-t-[18px] border border-b-0 border-line-strong bg-night-2 p-1 pb-0">
                          <Screen
                            src="/screens/booking.jpg"
                            alt="Booking page on a phone: picking a day and a free time"
                            width={585}
                            height={1266}
                            className="rounded-t-[14px]"
                          />
                        </div>
                      ) : (
                        <Screen
                          src={i === 0 ? '/screens/step-services.jpg' : '/screens/step-agenda.jpg'}
                          alt={
                            i === 0
                              ? 'Services list with duration, price and the professionals who offer each one'
                              : 'Today’s schedule with one lane per professional and a line for the current time'
                          }
                          width={1200}
                          height={i === 0 ? 540 : 465}
                          className="h-full object-cover object-left-top"
                        />
                      )}
                    </div>
                    <figcaption className="mono mt-2.5 text-[12px] text-muted">
                      {s.where}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features: bento grid, each card shows the real thing */}
        <section
          className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28"
          aria-labelledby="features-title"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
            <div>
              <p className="eyebrow mb-4">What’s inside</p>
              <h2 id="features-title" className={`max-w-md ${h2}`}>
                Everything a booking business needs, nothing it doesn’t.
              </h2>
            </div>
            <p className="max-w-lg self-end text-[16px] leading-relaxed text-ink-soft">
              A booking page for clients and a workspace for the team. Every number on screen comes
              from real bookings: no spreadsheets, no manual counting.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-6">
            {/* Integrity: the actual constraint */}
            <article className="flex min-w-0 flex-col overflow-hidden rounded-xl bg-night text-night-text lg:col-span-4">
              <div className="px-6 pt-6 sm:px-7 sm:pt-7">
                <p className="mono text-[12px] text-signal uppercase">Integrity</p>
                <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-white">
                  Double booking is impossible
                </h3>
                <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-night-muted">
                  The check doesn’t live only in the code. A PostgreSQL exclusion constraint rejects
                  overlapping appointments for the same professional, even when two clients book at
                  the same instant.
                </p>
              </div>
              <figure className="mt-6 flex-1 border-t border-night-line bg-night-2">
                <figcaption className="mono flex items-center gap-2 border-b border-night-line px-6 py-2.5 text-[11px] text-night-muted sm:px-7">
                  <span className="size-1.5 rounded-full bg-success" aria-hidden />
                  prisma/migrations/…_init/migration.sql
                </figcaption>
                <pre
                  className="mono overflow-x-auto px-6 py-5 text-[12.5px] leading-[1.75] text-night-text sm:px-7 sm:text-[13px]"
                  aria-label="SQL exclusion constraint that prevents overlapping appointments"
                >
                  <code>
                    {SQL.map((line, li) => (
                      <span key={li} className="block">
                        {line.map(([text, kind], ti) => (
                          <span key={ti} className={kind ? TOK_CLASS[kind] : undefined}>
                            {text}
                          </span>
                        ))}
                      </span>
                    ))}
                  </code>
                </pre>
              </figure>
            </article>

            {/* Availability: real slots from the booking page */}
            <article className="flex min-w-0 flex-col rounded-xl border border-line bg-surface p-6 shadow-soft sm:p-7 lg:col-span-2">
              <p className="mono text-[12px] text-accent-ink uppercase">Availability</p>
              <h3 className="mt-2 text-[19px] font-semibold tracking-[-0.02em]">
                Real free slots, from the server
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                Times come from working hours, service length and existing bookings. The client
                never guesses.
              </p>
              <div className="mt-6 flex max-w-[340px] flex-1 items-end">
                <Screen
                  src="/screens/feature-slots.jpg"
                  alt="Free times on the booking page, grouped into afternoon and evening"
                  width={716}
                  height={415}
                  className="rounded-md"
                />
              </div>
            </article>

            {/* Roles: the menus each role really gets */}
            <article className="flex min-w-0 flex-col rounded-xl border border-line bg-surface p-6 shadow-soft sm:p-7 lg:col-span-2">
              <p className="mono text-[12px] text-accent-ink uppercase">Roles</p>
              <h3 className="mt-2 text-[19px] font-semibold tracking-[-0.02em]">
                Owners manage, staff see their own day
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                The API checks the role on every request. A professional only gets their own
                appointments.
              </p>
              <div className="mt-6 grid flex-1 grid-cols-2 gap-2">
                {Object.entries(ROLE_MENUS).map(([role, items]) => (
                  <div key={role} className="flex flex-col rounded-lg bg-night p-3">
                    <p className="eyebrow mb-2 text-night-muted">{role}</p>
                    <ul className="space-y-1 text-[12.5px]">
                      {items.map((item) => (
                        <li key={item} className="truncate text-night-text">
                          {item}
                        </li>
                      ))}
                    </ul>
                    {role === 'Staff' && (
                      <p className="mt-auto pt-3 text-[11.5px] leading-snug text-signal">
                        Only their own appointments
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </article>

            {/* Reports: the real chart */}
            <article className="flex min-w-0 flex-col rounded-xl border border-line bg-surface p-6 shadow-soft sm:p-7 lg:col-span-4">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <div className="max-w-md">
                  <p className="mono text-[12px] text-accent-ink uppercase">Reports</p>
                  <h3 className="mt-2 text-[19px] font-semibold tracking-[-0.02em]">
                    Revenue, occupancy and top services
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                    Per day, per professional and per service, with CSV export for the accountant.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-1 items-end">
                <Screen
                  src="/screens/feature-reports.jpg"
                  alt="Revenue per day for the current week"
                  width={1200}
                  height={382}
                  className="rounded-md border border-line"
                />
              </div>
            </article>
          </div>
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

        {/* Industries: icon cards, honest about the demo */}
        <section
          className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-24"
          aria-labelledby="for-title"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
            <div>
              <p className="eyebrow mb-4">Who it’s for</p>
              <h2 id="for-title" className={`max-w-md ${h2}`}>
                Made for businesses that sell time.
              </h2>
            </div>
            <p className="max-w-lg self-end text-[16px] leading-relaxed text-ink-soft">
              The demo is a barbershop, but the model is generic: services with a length and a
              price, professionals with working hours, and clients who book a slot.
            </p>
          </div>
          <ul className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((ind) => (
              <li
                key={ind.name}
                className="flex items-center gap-3.5 rounded-lg border border-line bg-surface p-4 shadow-soft"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-canvas text-ink-soft">
                  <ind.icon className="size-[18px]" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold tracking-[-0.01em]">
                    {ind.name}
                  </span>
                  <span className="block truncate text-[13px] text-muted">{ind.text}</span>
                </span>
              </li>
            ))}
            <li>
              <Link
                to={`/book/${DEMO_SLUG}`}
                className="group flex h-full items-center gap-3.5 rounded-lg bg-accent-strong p-4 text-white transition-colors hover:bg-accent-deep"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold tracking-[-0.01em]">
                    See the barbershop demo
                  </span>
                  <span className="block text-[13px] text-accent-50">Book a real slot</span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          </ul>
        </section>

        {/* Under the hood: verifiable facts for technical readers */}
        <section className="bg-night text-night-text" aria-labelledby="hood-title">
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-24">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
              <div>
                <p className="eyebrow mb-4 text-signal">Under the hood</p>
                <h2 id="hood-title" className={`max-w-md text-white ${h2}`}>
                  Built and tested like a production app.
                </h2>
              </div>
              <div className="self-end">
                <p className="max-w-lg text-[16px] leading-relaxed text-night-muted">
                  A NestJS API and a React app in one TypeScript monorepo. Every pull request runs
                  lint, type checks, unit and end-to-end tests against a real PostgreSQL database.
                </p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
                  <a
                    href="https://github.com/lucaswsanchez/bookflow"
                    className="inline-flex items-center gap-1 font-medium text-white hover:text-accent-100"
                  >
                    Source on GitHub <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                  <a
                    href={`${API_URL}/docs`}
                    className="inline-flex items-center gap-1 font-medium text-white hover:text-accent-100"
                  >
                    API docs (Swagger) <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                </div>
              </div>
            </div>

            <dl className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-night-line bg-night-line sm:grid-cols-2 lg:grid-cols-4">
              {FACTS.map((f) => (
                <div key={f.label} className="bg-night-2 p-5 sm:p-6">
                  <dt className="sr-only">{f.label}</dt>
                  <dd>
                    <p className="tabular text-[36px] leading-none font-semibold tracking-[-0.03em] text-white">
                      {f.value}
                    </p>
                    <p className="mt-2 text-[14px] font-medium text-night-text">{f.label}</p>
                    <p className="mt-1 text-[13px] text-night-muted">{f.detail}</p>
                  </dd>
                </div>
              ))}
            </dl>

            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Tech stack">
              {STACK.map((t) => (
                <li
                  key={t}
                  className="mono rounded-md border border-night-line px-2.5 py-1 text-[12px] text-night-text"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-accent-strong px-6 py-10 text-white sm:px-10 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-[26px] leading-tight font-semibold tracking-[-0.03em] sm:text-[30px]">
                See it with real data.
              </h2>
              <p className="mt-2 text-[15px] text-accent-50">
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
