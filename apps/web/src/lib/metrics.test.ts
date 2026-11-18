import { describe, expect, it } from 'vitest';
import {
  countByStatus,
  eachDay,
  occupancyByStaff,
  revenueOf,
  scheduledMinutes,
  topServices,
  totalOccupancy,
  totalsByDay,
} from './metrics';
import type { Appointment, AppointmentStatus, StaffMember } from './types';

// Mon 2026-11-30 → Sun 2026-12-06. Martín works Mon–Fri 09:00–13:00 (240 min/day).
const martin: StaffMember = {
  id: 's1',
  name: 'Martín Acosta',
  title: null,
  color: '#173d32',
  workingHours: [1, 2, 3, 4, 5].map((weekday) => ({
    weekday,
    startMinute: 9 * 60,
    endMinute: 13 * 60,
  })),
};

let seq = 0;
function appt(
  startsAt: string,
  durationMinutes: number,
  status: AppointmentStatus = 'CONFIRMED',
  service = { id: 'cut', name: 'Classic Haircut' },
  price = 9000,
): Appointment {
  const start = new Date(startsAt);
  return {
    id: `a${++seq}`,
    code: `BF-${seq}`,
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + durationMinutes * 60_000).toISOString(),
    status,
    price,
    notes: null,
    service: { ...service, durationMinutes },
    staff: { id: 's1', name: 'Martín Acosta', color: '#173d32' },
    client: { id: 'c1', name: 'Ana', phone: '3794000000', email: null },
  };
}

describe('metrics', () => {
  it('lists every day of a range', () => {
    expect(eachDay('2026-11-30', '2026-12-02')).toEqual(['2026-11-30', '2026-12-01', '2026-12-02']);
  });

  it('computes scheduled minutes from weekly working hours', () => {
    expect(scheduledMinutes(martin, '2026-11-30', '2026-12-06')).toBe(5 * 240);
    expect(scheduledMinutes(martin, '2026-12-05', '2026-12-06')).toBe(0); // weekend
  });

  it('computes occupancy ignoring cancelled appointments', () => {
    const appointments = [
      appt('2026-11-30T12:00:00Z', 60), // 09:00 local
      appt('2026-11-30T13:00:00Z', 60, 'NO_SHOW'),
      appt('2026-11-30T14:00:00Z', 60, 'CANCELLED'),
    ];
    const [row] = occupancyByStaff([martin], appointments, '2026-11-30', '2026-11-30');
    expect(row.bookedMinutes).toBe(120);
    expect(row.rate).toBe(0.5);
    expect(totalOccupancy([row])).toBe(0.5);
    expect(occupancyByStaff([martin], [], '2026-12-05', '2026-12-05')[0].rate).toBeNull();
  });

  it('groups totals by local day and only bills confirmed or completed', () => {
    const appointments = [
      appt('2026-12-01T01:30:00Z', 30, 'COMPLETED'), // still Nov 30 in Corrientes
      appt('2026-12-01T13:00:00Z', 30, 'NO_SHOW'),
      appt('2026-12-01T14:00:00Z', 30, 'CANCELLED'),
    ];
    expect(totalsByDay(appointments, '2026-11-30', '2026-12-01')).toEqual([
      { date: '2026-11-30', appointments: 1, revenue: 9000 },
      { date: '2026-12-01', appointments: 1, revenue: 0 },
    ]);
    expect(revenueOf(appointments)).toBe(9000);
    expect(countByStatus(appointments)).toEqual({
      CONFIRMED: 0,
      COMPLETED: 1,
      CANCELLED: 1,
      NO_SHOW: 1,
    });
  });

  it('ranks services by appointments', () => {
    const beard = { id: 'beard', name: 'Beard Trim' };
    const ranked = topServices([
      appt('2026-12-01T12:00:00Z', 20, 'CONFIRMED', beard, 6000),
      appt('2026-12-01T13:00:00Z', 20, 'COMPLETED', beard, 6000),
      appt('2026-12-01T14:00:00Z', 30),
      appt('2026-12-01T15:00:00Z', 30, 'CANCELLED'),
    ]);
    expect(ranked.map((s) => [s.name, s.appointments, s.revenue])).toEqual([
      ['Beard Trim', 2, 12000],
      ['Classic Haircut', 1, 9000],
    ]);
  });
});
