import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarPlus, Check, Clock, MapPin, Phone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Avatar,
  BusinessMark,
  Button,
  ErrorState,
  IconButton,
  Logo,
  Skeleton,
  Spinner,
} from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import {
  addDays,
  formatDay,
  formatDuration,
  formatPrice,
  formatTime,
  toLocalDate,
} from '../../lib/format';
import { downloadIcs } from '../../lib/ics';
import type {
  Availability,
  BookingSummary,
  Business,
  Service,
  Slot,
  StaffMember,
} from '../../lib/types';
import {
  ClientDetailsForm,
  DayPicker,
  ServiceList,
  SlotPicker,
  StaffList,
  StepIndicator,
} from './components';
import type { ClientDetails } from './schema';

const DAYS_AHEAD = 14;

export default function BookingPage() {
  const { slug = '' } = useParams();
  const base = `/public/businesses/${slug}`;

  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState<BookingSummary | null>(null);

  const business = useQuery({ queryKey: ['business', slug], queryFn: () => api<Business>(base) });
  const tz = business.data?.timezone;
  const days = useMemo(() => {
    const today = toLocalDate(new Date(), tz);
    return Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));
  }, [tz]);
  const [date, setDate] = useState(days[0]);

  const services = useQuery({
    queryKey: ['public-services', slug],
    queryFn: () => api<Service[]>(`${base}/services`),
    enabled: business.isSuccess,
  });
  const staffList = useQuery({
    queryKey: ['public-staff', slug, service?.id],
    queryFn: () => api<StaffMember[]>(`${base}/staff`, { query: { serviceId: service!.id } }),
    enabled: !!service,
  });
  // Availability always comes from the API: the client never computes free slots.
  const availability = useQuery({
    queryKey: ['availability', slug, service?.id, staff?.id, date],
    queryFn: () =>
      api<Availability>(`${base}/availability`, {
        query: { serviceId: service!.id, staffId: staff!.id, date },
      }),
    enabled: !!service && !!staff && step === 2,
  });

  const book = useMutation({
    mutationFn: (values: ClientDetails) =>
      api<BookingSummary>(`${base}/bookings`, {
        method: 'POST',
        body: {
          serviceId: service!.id,
          staffId: staff!.id,
          startsAt: slot!.start,
          notes: values.notes || undefined,
          client: { name: values.name, phone: values.phone, email: values.email || undefined },
        },
      }),
    onSuccess: (data) => {
      setBooking(data);
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 409) void availability.refetch();
    },
  });

  const goTo = (next: number) => {
    setStep(next);
    // Keep the flow in view on phones without jumping back to the business header.
    const steps = document.getElementById('booking-steps');
    if (steps && steps.getBoundingClientRect().top < 0)
      steps.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const restart = () => {
    setStep(0);
    setService(null);
    setStaff(null);
    setSlot(null);
    setBooking(null);
    book.reset();
  };

  if (business.isLoading)
    return (
      <PageShell>
        <div className="space-y-4 py-8">
          <Skeleton className="size-14" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-8 h-64 w-full" />
        </div>
      </PageShell>
    );
  if (business.isError) {
    return (
      <PageShell>
        <div className="py-10">
          <ErrorState
            message={
              business.error instanceof ApiError && business.error.status === 404
                ? 'This business does not exist.'
                : business.error.message
            }
            onRetry={() => business.refetch()}
          />
        </div>
      </PageShell>
    );
  }
  const b = business.data!;

  if (step === 4 && booking) {
    return (
      <PageShell>
        <Confirmation booking={booking} onRestart={restart} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="pt-4 pb-8 sm:pt-8 sm:pb-10" data-testid="booking-header">
        <BusinessMark
          name={b.name}
          size="lg"
          className="size-12! text-xl! sm:size-14! sm:text-2xl!"
        />
        <h1
          className="mt-5 font-display text-[30px] leading-[1.05] text-forest sm:text-[44px]"
          data-testid="business-name"
        >
          {b.name}
        </h1>
        {b.description && (
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">{b.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted">
          {b.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden /> {b.address}
            </span>
          )}
          {b.phone && (
            <a href={`tel:${b.phone}`} className="flex items-center gap-1.5 hover:text-forest">
              <Phone className="size-3.5" aria-hidden /> {b.phone}
            </a>
          )}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div data-testid="booking-page" id="booking-steps" className="min-w-0 scroll-mt-4">
          <div className="mb-6 space-y-4">
            <StepIndicator current={step} />
            {(service || staff || slot) && (
              <MobileSummary service={service} staff={staff} slot={slot} tz={b.timezone} />
            )}
          </div>

          {step === 0 && (
            <Step title="What would you like to book?" testId="step-service">
              {services.isLoading ? (
                <Spinner />
              ) : services.isError ? (
                <ErrorState message={services.error.message} onRetry={() => services.refetch()} />
              ) : (
                <ServiceList
                  services={services.data ?? []}
                  onSelect={(s) => {
                    setService(s);
                    setStaff(null);
                    setSlot(null);
                    goTo(1);
                  }}
                />
              )}
            </Step>
          )}

          {step === 1 && (
            <Step title="Who would you like to see?" testId="step-staff" onBack={() => goTo(0)}>
              {staffList.isLoading ? (
                <Spinner />
              ) : staffList.isError ? (
                <ErrorState message={staffList.error.message} onRetry={() => staffList.refetch()} />
              ) : (
                <StaffList
                  staff={staffList.data ?? []}
                  onSelect={(s) => {
                    setStaff(s);
                    setSlot(null);
                    goTo(2);
                  }}
                />
              )}
            </Step>
          )}

          {step === 2 && (
            <Step title="Pick a day and time" testId="step-datetime" onBack={() => goTo(1)}>
              <div className="space-y-6">
                <DayPicker
                  days={days}
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setSlot(null);
                  }}
                />
                <div>
                  <p className="mb-3 text-sm font-semibold text-ink">
                    {formatDay(date, { weekday: 'long', month: 'long' })}
                  </p>
                  <SlotPicker
                    slots={availability.data?.slots}
                    loading={availability.isLoading}
                    error={availability.isError ? availability.error.message : null}
                    onRetry={() => availability.refetch()}
                    selected={slot?.start}
                    onSelect={(s) => {
                      setSlot(s);
                      goTo(3);
                    }}
                  />
                </div>
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step title="Almost done" testId="step-details" onBack={() => goTo(2)}>
              <ClientDetailsForm
                onSubmit={(values) => book.mutate(values)}
                submitting={book.isPending}
                error={
                  book.error
                    ? book.error instanceof ApiError && book.error.status === 409
                      ? 'Sorry, that time was just taken. Please go back and pick another one.'
                      : book.error.message
                    : null
                }
              />
            </Step>
          )}
        </div>

        <aside className="hidden lg:sticky lg:top-8 lg:block" aria-label="Your booking">
          <SummaryPanel service={service} staff={staff} slot={slot} tz={b.timezone} />
        </aside>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" aria-label="BookFlow home" className="opacity-80 hover:opacity-100">
          <Logo />
        </Link>
        <Link to="/login" className="text-[13px] font-semibold text-ink-soft hover:text-forest">
          Staff login
        </Link>
      </nav>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">{children}</main>
      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Online booking by <span className="font-semibold text-ink-soft">BookFlow</span>
      </footer>
    </div>
  );
}

function Step({
  title,
  testId,
  onBack,
  children,
}: {
  title: string;
  testId: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section data-testid={testId} aria-labelledby={`${testId}-title`} className="animate-rise">
      <div className="mb-4 flex items-center gap-1">
        {onBack && (
          <IconButton
            label="Go back"
            size="sm"
            onClick={onBack}
            data-testid="back-button"
            className="-ml-2"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </IconButton>
        )}
        <h2 id={`${testId}-title`} className="text-xl font-bold tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

interface SummaryProps {
  service: Service | null;
  staff: StaffMember | null;
  slot: Slot | null;
  tz: string;
}

/** Compact summary chips above the step on phones and tablets. */
function MobileSummary({ service, staff, slot, tz }: SummaryProps) {
  return (
    <dl className="flex flex-wrap gap-1.5 text-[13px] lg:hidden" data-testid="booking-summary">
      {service && (
        <div className="rounded-sm bg-surface px-2 py-1 ring-1 ring-line">
          <dt className="sr-only">Service</dt>
          <dd>
            <span className="font-semibold">{service.name}</span>{' '}
            <span className="text-muted">{formatPrice(service.price)}</span>
          </dd>
        </div>
      )}
      {staff && (
        <div className="rounded-sm bg-surface px-2 py-1 ring-1 ring-line">
          <dt className="sr-only">Professional</dt>
          <dd>{staff.name}</dd>
        </div>
      )}
      {slot && (
        <div className="rounded-sm bg-surface px-2 py-1 ring-1 ring-line">
          <dt className="sr-only">Time</dt>
          <dd>
            {formatDay(toLocalDate(new Date(slot.start), tz))} · {formatTime(slot.start, tz)}
          </dd>
        </div>
      )}
    </dl>
  );
}

/** Desktop side panel that fills in as the client progresses. */
function SummaryPanel({ service, staff, slot, tz }: SummaryProps) {
  const rows = [
    {
      label: 'Service',
      value: service ? (
        <>
          {service.name}
          <span className="block text-xs font-normal text-muted">
            {formatDuration(service.durationMinutes)}
          </span>
        </>
      ) : null,
    },
    {
      label: 'Professional',
      value: staff ? (
        <span className="flex items-center gap-2">
          <Avatar name={staff.name} color={staff.color} size="sm" /> {staff.name}
        </span>
      ) : null,
    },
    {
      label: 'When',
      value: slot ? (
        <>
          {formatDay(toLocalDate(new Date(slot.start), tz), { month: 'long' })}
          <span className="block text-xs font-normal text-muted">
            {formatTime(slot.start, tz)} – {formatTime(slot.end, tz)}
          </span>
        </>
      ) : null,
    },
  ];
  return (
    <div className="rounded-lg border border-line bg-surface" data-testid="booking-summary-panel">
      <p className="eyebrow border-b border-line px-5 py-3">Your booking</p>
      <dl className="divide-y divide-line">
        {rows.map((r) => (
          <div key={r.label} className="px-5 py-3.5">
            <dt className="text-xs text-muted">{r.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold">
              {r.value ?? <span className="font-normal text-faint">Not selected</span>}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex items-baseline justify-between border-t border-line bg-canvas/60 px-5 py-4">
        <span className="text-sm text-muted">Total</span>
        <span className="tabular text-lg font-bold">
          {service ? formatPrice(service.price) : '—'}
        </span>
      </div>
      <p className="px-5 py-3 text-xs text-muted">Pay at the venue. No account needed.</p>
    </div>
  );
}

function Confirmation({ booking, onRestart }: { booking: BookingSummary; onRestart: () => void }) {
  const tz = booking.business.timezone;
  return (
    <div
      className="mx-auto max-w-md animate-rise py-6 text-center sm:py-12"
      data-testid="booking-confirmation"
    >
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-forest text-sand">
        <Check className="size-7" strokeWidth={2.5} aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-[36px] leading-tight text-forest">
        You’re booked, {booking.clientName.split(' ')[0]}.
      </h1>
      <p className="mt-2 text-sm text-muted">
        We’re expecting you at {booking.business.name}. Keep this code handy.
      </p>

      <div className="mt-8 overflow-hidden rounded-lg border border-line bg-surface text-left">
        <div className="border-b border-dashed border-line-strong px-6 py-5 text-center">
          <p className="eyebrow">Booking code</p>
          <p
            className="mt-1 font-mono text-[28px] font-bold tracking-[0.18em] text-forest"
            data-testid="booking-code"
          >
            {booking.code}
          </p>
        </div>
        <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 px-6 py-5 text-sm">
          <dt className="text-muted">When</dt>
          <dd className="font-semibold" data-testid="booking-datetime">
            {formatDay(toLocalDate(new Date(booking.startsAt), tz), { month: 'long' })},{' '}
            {formatTime(booking.startsAt, tz)}
          </dd>
          <dt className="text-muted">Service</dt>
          <dd className="font-semibold">
            {booking.service.name}
            <span className="ml-1.5 inline-flex items-center gap-1 font-normal text-muted">
              <Clock className="size-3" aria-hidden />
              {formatDuration(booking.service.durationMinutes)}
            </span>
          </dd>
          <dt className="text-muted">Professional</dt>
          <dd className="font-semibold">{booking.staff.name}</dd>
          {booking.business.address && (
            <>
              <dt className="text-muted">Where</dt>
              <dd>{booking.business.address}</dd>
            </>
          )}
          <dt className="text-muted">Price</dt>
          <dd className="tabular font-semibold">{formatPrice(booking.price)}</dd>
        </dl>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button onClick={() => downloadIcs(booking)} data-testid="add-to-calendar">
          <CalendarPlus className="size-4" aria-hidden /> Add to calendar
        </Button>
        <Button variant="secondary" onClick={onRestart} data-testid="book-another">
          Book another appointment
        </Button>
      </div>
    </div>
  );
}
