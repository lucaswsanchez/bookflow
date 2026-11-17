import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatDuration,
  formatTime,
  minutesOfDay,
  slugify,
  startOfWeek,
  timeToMinutes,
  toLocalDate,
} from './format';

describe('date helpers', () => {
  it('uses the business time zone to decide the local date', () => {
    // 01:30 UTC on Dec 2 is still 22:30 on Dec 1 in Corrientes (UTC-3)
    expect(toLocalDate(new Date('2026-12-02T01:30:00Z'))).toBe('2026-12-01');
    expect(formatTime('2026-12-02T01:30:00Z')).toBe('22:30');
    expect(minutesOfDay('2026-12-02T01:30:00Z')).toBe(22 * 60 + 30);
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('finds the Monday of the week', () => {
    expect(startOfWeek('2026-12-03')).toBe('2026-11-30'); // Thursday → Monday
    expect(startOfWeek('2026-12-06')).toBe('2026-11-30'); // Sunday → previous Monday
    expect(startOfWeek('2026-11-30')).toBe('2026-11-30');
  });
});

describe('formatting helpers', () => {
  it('formats durations', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
  });

  it('builds stable slugs from accented names', () => {
    expect(slugify('Martín Acosta')).toBe('martin-acosta');
    expect(slugify('Haircut + Beard')).toBe('haircut-beard');
  });

  it('converts HH:mm to minutes', () => {
    expect(timeToMinutes('09:30')).toBe(570);
  });
});
