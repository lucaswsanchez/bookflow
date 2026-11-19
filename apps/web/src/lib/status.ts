import type { AppointmentStatus } from './types';

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};

/** Tailwind classes per status: dot, badge and agenda block. */
export const STATUS_TONES: Record<
  AppointmentStatus,
  { dot: string; badge: string; block: string; label: string }
> = {
  CONFIRMED: {
    dot: 'bg-accent',
    badge: 'bg-accent-50 text-accent-ink',
    block: 'border-accent bg-accent-50 text-accent-ink',
    label: STATUS_LABELS.CONFIRMED,
  },
  COMPLETED: {
    dot: 'bg-success',
    badge: 'bg-success-50 text-success',
    block: 'border-success bg-success-50 text-ink-soft',
    label: STATUS_LABELS.COMPLETED,
  },
  CANCELLED: {
    dot: 'bg-faint',
    badge: 'bg-subtle text-muted',
    block: 'border-line-strong bg-subtle text-muted line-through decoration-faint',
    label: STATUS_LABELS.CANCELLED,
  },
  NO_SHOW: {
    dot: 'bg-signal',
    badge: 'bg-signal-50 text-signal-700',
    block: 'border-signal bg-signal-50 text-signal-700',
    label: STATUS_LABELS.NO_SHOW,
  },
};
