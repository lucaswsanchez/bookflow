import type { AppointmentStatus } from './types';

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};
