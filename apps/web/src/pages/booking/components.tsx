import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { ChevronRight, Clock, Moon, Sun, Sunrise } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Skeleton,
  Textarea,
} from '../../components/ui';
import { formatDay, formatDuration, formatPrice, slugify } from '../../lib/format';
import type { Service, Slot, StaffMember } from '../../lib/types';
import { ClientDetails, clientDetailsSchema } from './schema';

const STEPS = ['Service', 'Professional', 'Date & time', 'Your details'] as const;

/** Compact progress: "Step 2 of 4 · Professional" with a segmented bar. */
export function StepIndicator({ current }: { current: number }) {
  return (
    <div data-testid="step-indicator">
      <p className="mb-2 flex items-baseline justify-between text-[13px]">
        <span className="font-bold text-ink">{STEPS[current]}</span>
        <span className="text-muted">
          Step {current + 1} of {STEPS.length}
        </span>
      </p>
      <ol className="grid grid-cols-4 gap-1.5" aria-label="Booking progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === current ? 'step' : undefined}
            className={clsx(
              'h-1 rounded-full transition-colors duration-300',
              i <= current ? 'bg-forest' : 'bg-line',
            )}
          >
            <span className="sr-only">
              {label}
              {i < current ? ' (done)' : ''}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function OptionRow({
  onClick,
  testId,
  children,
}: {
  onClick: () => void;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-forest-50/50 focus-visible:bg-forest-50/50 sm:px-5"
    >
      {children}
      <ChevronRight
        className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-forest"
        aria-hidden
      />
    </button>
  );
}

export function ServiceList({
  services,
  onSelect,
}: {
  services: Service[];
  onSelect: (s: Service) => void;
}) {
  if (services.length === 0) {
    return (
      <EmptyState
        title="No services available"
        description="This business has no bookable services right now."
      />
    );
  }
  return (
    <ul
      className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface"
      data-testid="service-list"
    >
      {services.map((s) => (
        <li key={s.id}>
          <OptionRow onClick={() => onSelect(s)} testId={`service-option-${slugify(s.name)}`}>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink group-hover:text-forest">{s.name}</span>
              {s.description && (
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                  {s.description}
                </span>
              )}
              <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-ink-soft">
                <Clock className="size-3.5 text-faint" aria-hidden />
                {formatDuration(s.durationMinutes)}
              </span>
            </span>
            <span className="tabular shrink-0 font-bold text-ink">{formatPrice(s.price)}</span>
          </OptionRow>
        </li>
      ))}
    </ul>
  );
}

export function StaffList({
  staff,
  onSelect,
}: {
  staff: StaffMember[];
  onSelect: (s: StaffMember) => void;
}) {
  if (staff.length === 0) {
    return (
      <EmptyState
        title="No professionals available"
        description="Nobody offers this service at the moment."
      />
    );
  }
  return (
    <ul
      className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface"
      data-testid="staff-list"
    >
      {staff.map((s) => (
        <li key={s.id}>
          <OptionRow onClick={() => onSelect(s)} testId={`staff-option-${slugify(s.name)}`}>
            <Avatar name={s.name} color={s.color} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink group-hover:text-forest">{s.name}</span>
              {s.title && <span className="block text-[13px] text-muted">{s.title}</span>}
            </span>
          </OptionRow>
        </li>
      ))}
    </ul>
  );
}

export function DayPicker({
  days,
  selected,
  onSelect,
}: {
  days: string[];
  selected: string;
  onSelect: (d: string) => void;
}) {
  return (
    <div
      className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,black_calc(100%-48px),transparent)] [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0"
      role="listbox"
      aria-label="Choose a day"
      data-testid="day-picker"
    >
      {days.map((d, i) => {
        const active = d === selected;
        return (
          <button
            key={d}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onSelect(d)}
            data-testid={`day-option-${d}`}
            className={clsx(
              'flex w-[60px] shrink-0 snap-start flex-col items-center rounded-lg border py-2.5 transition-colors',
              active
                ? 'border-forest bg-forest text-white'
                : 'border-line bg-surface text-ink hover:border-moss',
            )}
          >
            <span
              className={clsx('text-[11px] font-semibold', active ? 'text-sage' : 'text-muted')}
            >
              {i === 0
                ? 'Today'
                : formatDay(d, { weekday: 'short', month: undefined, day: undefined })}
            </span>
            <span className="tabular text-xl leading-tight font-bold">{Number(d.slice(8))}</span>
            <span className={clsx('text-[11px]', active ? 'text-sage' : 'text-muted')}>
              {formatDay(d, { weekday: undefined, month: 'short', day: undefined })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface SlotPickerProps {
  slots: Slot[] | undefined;
  loading?: boolean;
  error?: string | null;
  selected?: string;
  onSelect: (slot: Slot) => void;
  onRetry?: () => void;
}

const PARTS = [
  { label: 'Morning', icon: Sunrise, test: (h: number) => h < 12 },
  { label: 'Afternoon', icon: Sun, test: (h: number) => h >= 12 && h < 18 },
  { label: 'Evening', icon: Moon, test: (h: number) => h >= 18 },
];

/** Available times from the API, grouped by part of the day. */
export function SlotPicker({
  slots,
  loading,
  error,
  selected,
  onSelect,
  onRetry,
}: SlotPickerProps) {
  if (loading) {
    return (
      <div role="status" aria-label="Checking availability…">
        <span className="sr-only">Checking availability…</span>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" aria-hidden>
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!slots || slots.length === 0) {
    return (
      <EmptyState
        testId="slots-empty"
        title="No times available this day"
        description="Try another day or choose a different professional."
      />
    );
  }
  return (
    <div className="space-y-5" data-testid="slot-list" aria-label="Available times">
      {PARTS.map(({ label, icon: Icon, test }) => {
        const group = slots.filter((s) => test(Number(s.time.slice(0, 2))));
        if (group.length === 0) return null;
        return (
          <div key={label}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Icon className="size-3.5" aria-hidden /> {label}
              <span className="text-faint">· {group.length}</span>
            </p>
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {group.map((slot) => (
                <li key={slot.start}>
                  <button
                    type="button"
                    onClick={() => onSelect(slot)}
                    aria-pressed={selected === slot.start}
                    data-testid={`slot-option-${slot.time.replace(':', '-')}`}
                    className={clsx(
                      'tabular h-11 w-full rounded-md border text-sm font-semibold transition-colors',
                      selected === slot.start
                        ? 'border-forest bg-forest text-white'
                        : 'border-line bg-surface text-ink hover:border-forest hover:bg-forest-50 hover:text-forest',
                    )}
                  >
                    {slot.time}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function ClientDetailsForm({
  onSubmit,
  submitting,
  error,
  footer,
}: {
  onSubmit: (values: ClientDetails) => void;
  submitting?: boolean;
  error?: string | null;
  footer?: React.ReactNode;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientDetails>({
    resolver: zodResolver(clientDetailsSchema),
    defaultValues: { name: '', phone: '', email: '', notes: '' },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
      data-testid="details-form"
    >
      <Field label="Full name" htmlFor="name" error={errors.name?.message}>
        <Input
          id="name"
          autoComplete="name"
          invalid={!!errors.name}
          data-testid="input-name"
          className="h-12 text-base sm:h-10 sm:text-sm"
          {...register('name')}
        />
      </Field>
      <Field
        label="Phone"
        htmlFor="phone"
        error={errors.phone?.message}
        hint="Only used to identify your booking."
      >
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+54 379 4123456"
          invalid={!!errors.phone}
          data-testid="input-phone"
          className="h-12 text-base sm:h-10 sm:text-sm"
          {...register('phone')}
        />
      </Field>
      <Field label="Email" htmlFor="email" optional error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          invalid={!!errors.email}
          data-testid="input-email"
          className="h-12 text-base sm:h-10 sm:text-sm"
          {...register('email')}
        />
      </Field>
      <Field label="Notes" htmlFor="notes" optional>
        <Textarea
          id="notes"
          rows={2}
          placeholder="Anything the professional should know?"
          data-testid="input-notes"
          className="text-base sm:text-sm"
          {...register('notes')}
        />
      </Field>
      {footer}
      {error && (
        <p
          role="alert"
          className="rounded-md bg-danger-50 px-3 py-2.5 text-sm font-medium text-danger"
          data-testid="booking-error"
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        loading={submitting}
        className="w-full"
        data-testid="submit-booking"
      >
        Confirm booking
      </Button>
      <p className="text-center text-xs text-muted">No account or payment needed.</p>
    </form>
  );
}
