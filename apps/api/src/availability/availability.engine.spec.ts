import {
  AvailabilityInput,
  computeAvailableSlots,
  InvalidAvailabilityInputError,
} from './availability.engine';

const TZ = 'America/Argentina/Buenos_Aires'; // UTC-03:00, no DST
const h = (hours: number, minutes = 0) => hours * 60 + minutes;
/** Builds a Date from a local Corrientes wall-clock time. */
const local = (iso: string) => new Date(`${iso}-03:00`);

// 2026-12-01 is a Tuesday (weekday 2)
const TUESDAY = '2026-12-01';
const base: AvailabilityInput = {
  date: TUESDAY,
  timezone: TZ,
  workingHours: [{ weekday: 2, startMinute: h(9), endMinute: h(12) }],
  durationMinutes: 30,
  busy: [],
  now: local('2026-11-20T10:00:00'), // well in the past relative to TUESDAY
  stepMinutes: 30,
  minNoticeMinutes: 60,
};
const times = (input: Partial<AvailabilityInput>) =>
  computeAvailableSlots({ ...base, ...input }).map((s) => s.time);

describe('computeAvailableSlots', () => {
  it('returns every slot that fits in the working range', () => {
    expect(times({})).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
  });

  it('returns ISO instants in UTC and local wall-clock times', () => {
    const [first] = computeAvailableSlots(base);
    expect(first).toEqual({
      start: '2026-12-01T12:00:00.000Z',
      end: '2026-12-01T12:30:00.000Z',
      time: '09:00',
    });
  });

  it('returns no slots on a day off', () => {
    expect(times({ date: '2026-11-29' })).toEqual([]); // Sunday
  });

  it('returns no slots when the service is longer than the shift', () => {
    expect(times({ durationMinutes: 240 })).toEqual([]);
  });

  it('never lets a slot run past the end of the shift', () => {
    // 11:00 → 11:50 fits; 11:30 → 12:20 would run past 12:00
    expect(times({ durationMinutes: 50 })).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });

  it('includes a slot that ends exactly when the shift ends', () => {
    expect(times({ durationMinutes: 180 })).toEqual(['09:00']);
  });

  it('supports split shifts and skips the break', () => {
    const slots = times({
      workingHours: [
        { weekday: 2, startMinute: h(9), endMinute: h(10) },
        { weekday: 2, startMinute: h(16), endMinute: h(17) },
      ],
    });
    expect(slots).toEqual(['09:00', '09:30', '16:00', '16:30']);
  });

  it('excludes slots overlapping an existing appointment', () => {
    const slots = times({
      busy: [{ start: local('2026-12-01T10:00:00'), end: local('2026-12-01T10:45:00') }],
    });
    expect(slots).toEqual(['09:00', '09:30', '11:00', '11:30']);
  });

  it('allows back-to-back bookings (intervals are half-open)', () => {
    const slots = times({
      busy: [{ start: local('2026-12-01T09:30:00'), end: local('2026-12-01T10:00:00') }],
    });
    expect(slots).toContain('09:00'); // ends 09:30, exactly when the busy block starts
    expect(slots).toContain('10:00'); // starts exactly when the busy block ends
    expect(slots).not.toContain('09:30');
  });

  it('blocks slots that would only partially overlap a busy block', () => {
    const slots = times({
      stepMinutes: 15,
      durationMinutes: 45,
      busy: [{ start: local('2026-12-01T10:00:00'), end: local('2026-12-01T10:30:00') }],
    });
    // 09:15 → 10:00 fits; 09:30 → 10:15 overlaps; 10:30 → 11:15 fits
    expect(slots).toContain('09:15');
    expect(slots).not.toContain('09:30');
    expect(slots).not.toContain('09:45');
    expect(slots).toContain('10:30');
  });

  it('returns nothing when the whole day is booked', () => {
    expect(
      times({ busy: [{ start: local('2026-12-01T08:00:00'), end: local('2026-12-01T13:00:00') }] }),
    ).toEqual([]);
  });

  it('ignores busy intervals on other days', () => {
    expect(
      times({ busy: [{ start: local('2026-12-02T09:00:00'), end: local('2026-12-02T12:00:00') }] }),
    ).toHaveLength(6);
  });

  it('hides past slots and respects the minimum notice for today', () => {
    const slots = times({ now: local('2026-12-01T09:40:00'), minNoticeMinutes: 60 });
    // earliest bookable start: 10:40 → first slot 11:00
    expect(slots).toEqual(['11:00', '11:30']);
  });

  it('returns nothing for a date in the past', () => {
    expect(times({ now: local('2026-12-02T08:00:00') })).toEqual([]);
  });

  it('uses the business time zone, not the server time zone, to pick the weekday', () => {
    // 21:00 local Tuesday is already 00:00 UTC Wednesday
    const slots = computeAvailableSlots({
      ...base,
      workingHours: [{ weekday: 2, startMinute: h(20), endMinute: h(22) }],
    });
    expect(slots.map((s) => s.time)).toEqual(['20:00', '20:30', '21:00', '21:30']);
    expect(slots[2].start).toBe('2026-12-02T00:00:00.000Z');
  });

  it('respects a custom step between start times', () => {
    expect(
      times({
        stepMinutes: 15,
        workingHours: [{ weekday: 2, startMinute: h(9), endMinute: h(10) }],
      }),
    ).toEqual(['09:00', '09:15', '09:30']);
  });

  it('deduplicates and sorts slots from overlapping or unordered ranges', () => {
    const slots = times({
      workingHours: [
        { weekday: 2, startMinute: h(10), endMinute: h(11) },
        { weekday: 2, startMinute: h(9), endMinute: h(10, 30) },
      ],
    });
    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30']);
  });

  it('ignores invalid ranges where end is before start', () => {
    expect(times({ workingHours: [{ weekday: 2, startMinute: h(12), endMinute: h(9) }] })).toEqual(
      [],
    );
  });

  it('rejects invalid dates and durations', () => {
    expect(() => computeAvailableSlots({ ...base, date: '2026-13-45' })).toThrow(
      InvalidAvailabilityInputError,
    );
    expect(() => computeAvailableSlots({ ...base, date: 'tomorrow' })).toThrow(
      InvalidAvailabilityInputError,
    );
    expect(() => computeAvailableSlots({ ...base, durationMinutes: 0 })).toThrow(
      InvalidAvailabilityInputError,
    );
  });
});
