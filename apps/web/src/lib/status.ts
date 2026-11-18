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
    dot: 'bg-forest',
    badge: 'bg-forest-50 text-forest',
    block: 'border-forest bg-forest-50 text-forest',
    label: STATUS_LABELS.CONFIRMED,
  },
  COMPLETED: {
    dot: 'bg-sage',
    badge: 'bg-sage-50 text-moss',
    block: 'border-sage bg-sage-50 text-ink-soft',
    label: STATUS_LABELS.COMPLETED,
  },
  CANCELLED: {
    dot: 'bg-faint',
    badge: 'bg-subtle text-muted',
    block: 'border-line-strong bg-subtle text-muted line-through decoration-faint',
    label: STATUS_LABELS.CANCELLED,
  },
  NO_SHOW: {
    dot: 'bg-sand',
    badge: 'bg-sand-50 text-sand-700',
    block: 'border-sand bg-sand-50 text-sand-700',
    label: STATUS_LABELS.NO_SHOW,
  },
};
