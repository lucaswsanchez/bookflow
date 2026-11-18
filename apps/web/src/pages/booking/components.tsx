import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Check, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ClientDetails, clientDetailsSchema } from './schema';
import { Button, EmptyState, ErrorState, Field, Input, Spinner } from '../../components/ui';
import { formatDay, formatDuration, formatPrice, slugify } from '../../lib/format';
import type { Service, Slot, StaffMember } from '../../lib/types';

const STEPS = ['Service', 'Professional', 'Date & time', 'Your details'] as const;

export function StepIndicator({ current }: { current: number }) {
  return (
    <ol
      className="flex items-center gap-2"
      data-testid="step-indicator"
      aria-label="Booking progress"
    >
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={label}
            className="flex flex-1 items-center gap-2"
            aria-current={active ? 'step' : undefined}
          >
            <span
              className={clsx(
                'grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold',
                done && 'bg-forest text-white',
                active && 'bg-forest-100 text-forest ring-2 ring-forest',
                !done && !active && 'bg-subtle text-muted',
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span
              className={clsx(
                'hidden text-sm sm:block',
                active ? 'font-medium text-ink' : 'text-muted',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden />}
          </li>
        );
      })}
    </ol>
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
    <ul className="grid gap-3 sm:grid-cols-2" data-testid="service-list">
      {services.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onSelect(s)}
            data-testid={`service-option-${slugify(s.name)}`}
            className="group flex h-full w-full flex-col gap-1 rounded-lg border border-line bg-white p-4 text-left transition hover:border-forest hover:shadow-md"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="font-medium text-ink group-hover:text-forest">{s.name}</span>
              <span className="shrink-0 font-semibold text-ink">{formatPrice(s.price)}</span>
            </span>
            {s.description && <span className="text-sm text-muted">{s.description}</span>}
            <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs text-muted">
              <Clock className="size-3.5" aria-hidden /> {formatDuration(s.durationMinutes)}
            </span>
          </button>
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
    <ul className="grid gap-3 sm:grid-cols-3" data-testid="staff-list">
      {staff.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onSelect(s)}
            data-testid={`staff-option-${slugify(s.name)}`}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-line bg-white p-4 text-center transition hover:border-forest hover:shadow-md"
          >
            <span
              className="grid size-12 place-items-center rounded-full text-lg font-semibold text-white"
              style={{ backgroundColor: s.color }}
              aria-hidden
            >
              {s.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
            </span>
            <span className="font-medium text-ink">{s.name}</span>
            {s.title && <span className="text-xs text-muted">{s.title}</span>}
          </button>
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
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2"
      role="listbox"
      aria-label="Choose a day"
      data-testid="day-picker"
    >
      {days.map((d) => {
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
              'flex min-w-16 flex-col items-center rounded-lg border px-3 py-2 text-sm transition',
              active
                ? 'border-forest bg-forest text-white'
                : 'border-line bg-white text-ink-soft hover:border-brand-400',
            )}
          >
            <span className="text-xs uppercase opacity-80">
              {formatDay(d, { weekday: 'short', month: undefined, day: undefined })}
            </span>
            <span className="text-lg font-semibold">
              {formatDay(d, { weekday: undefined, month: undefined, day: 'numeric' })}
            </span>
            <span className="text-xs opacity-80">
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

export function SlotPicker({
  slots,
  loading,
  error,
  selected,
  onSelect,
  onRetry,
}: SlotPickerProps) {
  if (loading) return <Spinner label="Checking availability…" />;
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
    <ul
      className="grid grid-cols-3 gap-2 sm:grid-cols-5"
      data-testid="slot-list"
      aria-label="Available times"
    >
      {slots.map((slot) => (
        <li key={slot.start}>
          <button
            type="button"
            onClick={() => onSelect(slot)}
            aria-pressed={selected === slot.start}
            data-testid={`slot-option-${slot.time.replace(':', '-')}`}
            className={clsx(
              'w-full rounded-lg border px-2 py-2 text-sm font-medium transition',
              selected === slot.start
                ? 'border-forest bg-forest text-white'
                : 'border-line bg-white text-ink-soft hover:border-forest hover:text-forest',
            )}
          >
            {slot.time}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ClientDetailsForm({
  onSubmit,
  submitting,
  error,
}: {
  onSubmit: (values: ClientDetails) => void;
  submitting?: boolean;
  error?: string | null;
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
      className="space-y-4"
      data-testid="details-form"
    >
      <Field label="Full name" htmlFor="name" error={errors.name?.message}>
        <Input
          id="name"
          autoComplete="name"
          invalid={!!errors.name}
          data-testid="input-name"
          {...register('name')}
        />
      </Field>
      <Field
        label="Phone"
        htmlFor="phone"
        error={errors.phone?.message}
        hint="We use it to identify your booking."
      >
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+54 379 4123456"
          invalid={!!errors.phone}
          data-testid="input-phone"
          {...register('phone')}
        />
      </Field>
      <Field label="Email (optional)" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          invalid={!!errors.email}
          data-testid="input-email"
          {...register('email')}
        />
      </Field>
      <Field label="Notes (optional)" htmlFor="notes">
        <Input id="notes" data-testid="input-notes" {...register('notes')} />
      </Field>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger"
          data-testid="booking-error"
        >
          {error}
        </p>
      )}
      <Button type="submit" loading={submitting} className="w-full" data-testid="submit-booking">
        Confirm booking
      </Button>
    </form>
  );
}
