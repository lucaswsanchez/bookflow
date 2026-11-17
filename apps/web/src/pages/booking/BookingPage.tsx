import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarCheck, Clock, MapPin, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, ErrorState, Logo, Spinner } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import {
  addDays,
  formatDay,
  formatDuration,
  formatPrice,
  formatTime,
  toLocalDate,
} from '../../lib/format';
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
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 409) void availability.refetch();
    },
  });

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
        <Spinner />
      </PageShell>
    );
  if (business.isError) {
    return (
      <PageShell>
        <ErrorState
          message={
            business.error instanceof ApiError && business.error.status === 404
              ? 'This business does not exist.'
              : business.error.message
          }
          onRetry={() => business.refetch()}
        />
      </PageShell>
    );
  }
  const b = business.data!;

  return (
    <PageShell>
      <header className="mb-6 space-y-1" data-testid="booking-header">
        <p className="text-sm font-medium text-brand-700">Book an appointment</p>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl" data-testid="business-name">
          {b.name}
        </h1>
        {b.address && (
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="size-4" aria-hidden /> {b.address}
          </p>
        )}
      </header>

      <Card className="p-4 sm:p-6">
        <div data-testid="booking-page">
          {step < 4 && (
            <div className="mb-6 space-y-4">
              <StepIndicator current={step} />
              {(service || staff || slot) && (
                <Summary service={service} staff={staff} slot={slot} tz={b.timezone} />
              )}
            </div>
          )}

          {step === 0 && (
            <Section title="Choose a service" testId="step-service">
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
                    setStep(1);
                  }}
                />
              )}
            </Section>
          )}

          {step === 1 && (
            <Section title="Choose a professional" testId="step-staff" onBack={() => setStep(0)}>
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
                    setStep(2);
                  }}
                />
              )}
            </Section>
          )}

          {step === 2 && (
            <Section title="Choose a day and time" testId="step-datetime" onBack={() => setStep(1)}>
              <div className="space-y-4">
                <DayPicker
                  days={days}
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setSlot(null);
                  }}
                />
                <SlotPicker
                  slots={availability.data?.slots}
                  loading={availability.isLoading}
                  error={availability.isError ? availability.error.message : null}
                  onRetry={() => availability.refetch()}
                  selected={slot?.start}
                  onSelect={(s) => {
                    setSlot(s);
                    setStep(3);
                  }}
                />
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section title="Your details" testId="step-details" onBack={() => setStep(2)}>
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
            </Section>
          )}

          {step === 4 && booking && <Confirmation booking={booking} onRestart={restart} />}
        </div>
      </Card>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-50">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link to="/" aria-label="BookFlow home">
          <Logo />
        </Link>
        <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900">
          Staff login
        </Link>
      </nav>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-4">{children}</main>
    </div>
  );
}

function Section({
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
    <section data-testid={testId} aria-labelledby={`${testId}-title`}>
      <div className="mb-4 flex items-center gap-2">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            aria-label="Go back"
            data-testid="back-button"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Button>
        )}
        <h2 id={`${testId}-title`} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Summary({
  service,
  staff,
  slot,
  tz,
}: {
  service: Service | null;
  staff: StaffMember | null;
  slot: Slot | null;
  tz: string;
}) {
  return (
    <dl
      className="flex flex-wrap gap-x-5 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"
      data-testid="booking-summary"
    >
      {service && (
        <div className="flex items-center gap-1">
          <dt className="sr-only">Service</dt>
          <dd className="font-medium text-slate-900">{service.name}</dd>
          <dd>· {formatPrice(service.price)}</dd>
        </div>
      )}
      {staff && (
        <div className="flex items-center gap-1">
          <User className="size-4" aria-hidden />
          <dt className="sr-only">Professional</dt>
          <dd>{staff.name}</dd>
        </div>
      )}
      {slot && (
        <div className="flex items-center gap-1">
          <Clock className="size-4" aria-hidden />
          <dt className="sr-only">Time</dt>
          <dd>
            {formatDay(toLocalDate(new Date(slot.start), tz))} · {formatTime(slot.start, tz)}
          </dd>
        </div>
      )}
    </dl>
  );
}

function Confirmation({ booking, onRestart }: { booking: BookingSummary; onRestart: () => void }) {
  const tz = booking.business.timezone;
  return (
    <div
      className="flex flex-col items-center gap-4 py-4 text-center"
      data-testid="booking-confirmation"
    >
      <span className="grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
        <CalendarCheck className="size-7" aria-hidden />
      </span>
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          You're booked, {booking.clientName.split(' ')[0]}!
        </h2>
        <p className="text-sm text-slate-500">Show this code when you arrive.</p>
      </div>
      <p
        className="rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-6 py-3 font-mono text-2xl font-bold tracking-widest text-brand-700"
        data-testid="booking-code"
      >
        {booking.code}
      </p>
      <dl className="grid w-full max-w-sm grid-cols-2 gap-y-2 text-left text-sm">
        <dt className="text-slate-500">Service</dt>
        <dd className="font-medium text-slate-900">{booking.service.name}</dd>
        <dt className="text-slate-500">Professional</dt>
        <dd className="font-medium text-slate-900">{booking.staff.name}</dd>
        <dt className="text-slate-500">When</dt>
        <dd className="font-medium text-slate-900" data-testid="booking-datetime">
          {formatDay(toLocalDate(new Date(booking.startsAt), tz))},{' '}
          {formatTime(booking.startsAt, tz)}
        </dd>
        <dt className="text-slate-500">Duration</dt>
        <dd className="font-medium text-slate-900">
          {formatDuration(booking.service.durationMinutes)}
        </dd>
        <dt className="text-slate-500">Price</dt>
        <dd className="font-medium text-slate-900">{formatPrice(booking.price)}</dd>
      </dl>
      <Button variant="secondary" onClick={onRestart} data-testid="book-another">
        Book another appointment
      </Button>
    </div>
  );
}
