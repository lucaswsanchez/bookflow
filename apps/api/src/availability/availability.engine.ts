import { DateTime } from 'luxon';

/** A weekly working range. weekday: 0 = Sunday … 6 = Saturday; minutes from local midnight. */
export interface WorkingRange {
  weekday: number;
  startMinute: number;
  endMinute: number;
}

/** An occupied interval (e.g. an existing non-cancelled appointment). End is exclusive. */
export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface AvailabilityInput {
  /** Local calendar date in the business time zone, formatted YYYY-MM-DD. */
  date: string;
  /** IANA time zone of the business, e.g. America/Argentina/Buenos_Aires. */
  timezone: string;
  workingHours: WorkingRange[];
  durationMinutes: number;
  busy: BusyInterval[];
  /** Current instant; injected so the function stays pure and testable. */
  now: Date;
  /** Distance between candidate start times. Default: 15 minutes. */
  stepMinutes?: number;
  /** Minimum time between now and the start of a bookable slot. Default: 60 minutes. */
  minNoticeMinutes?: number;
}

export interface Slot {
  /** ISO-8601 instant (UTC). */
  start: string;
  /** ISO-8601 instant (UTC). */
  end: string;
  /** Local wall-clock start time in the business time zone, HH:mm. */
  time: string;
}

export class InvalidAvailabilityInputError extends Error {}

/**
 * Computes the bookable slots for one staff member, one service and one local date.
 *
 * Pure function: no I/O, no clock access. A slot is offered when
 *  1. it fits entirely inside one of the staff member's working ranges for that weekday,
 *  2. it doesn't overlap any busy interval (half-open intervals, so back-to-back is fine),
 *  3. it starts at least `minNoticeMinutes` after `now`.
 */
export function computeAvailableSlots(input: AvailabilityInput): Slot[] {
  const {
    date,
    timezone,
    workingHours,
    durationMinutes,
    busy,
    now,
    stepMinutes = 15,
    minNoticeMinutes = 60,
  } = input;

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new InvalidAvailabilityInputError('durationMinutes must be a positive integer');
  }
  if (!Number.isInteger(stepMinutes) || stepMinutes <= 0) {
    throw new InvalidAvailabilityInputError('stepMinutes must be a positive integer');
  }
  const day = DateTime.fromISO(date, { zone: timezone });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !day.isValid) {
    throw new InvalidAvailabilityInputError('date must be a valid YYYY-MM-DD date');
  }

  const startOfDay = day.startOf('day');
  const weekday = startOfDay.weekday % 7; // luxon: 1 = Mon … 7 = Sun  →  0 = Sun … 6 = Sat
  const earliestStart = now.getTime() + minNoticeMinutes * 60_000;
  const busyMs = busy.map((b) => ({ start: b.start.getTime(), end: b.end.getTime() }));

  const ranges = workingHours
    .filter((r) => r.weekday === weekday && r.endMinute > r.startMinute)
    .sort((a, b) => a.startMinute - b.startMinute);

  const slots = new Map<number, Slot>();
  for (const range of ranges) {
    for (
      let minute = range.startMinute;
      minute + durationMinutes <= range.endMinute;
      minute += stepMinutes
    ) {
      const start = startOfDay.plus({ minutes: minute });
      const end = start.plus({ minutes: durationMinutes });
      const startMs = start.toMillis();
      const endMs = end.toMillis();

      if (startMs < earliestStart) continue;
      if (busyMs.some((b) => startMs < b.end && endMs > b.start)) continue;

      slots.set(startMs, {
        start: start.toUTC().toISO()!,
        end: end.toUTC().toISO()!,
        time: start.toFormat('HH:mm'),
      });
    }
  }

  return [...slots.entries()].sort(([a], [b]) => a - b).map(([, slot]) => slot);
}
