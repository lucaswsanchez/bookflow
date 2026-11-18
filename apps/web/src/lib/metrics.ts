import { addDays, DEFAULT_TZ, toLocalDate } from './format';
import type { Appointment, AppointmentStatus, StaffMember } from './types';

/**
 * Business metrics derived from real appointments returned by the API.
 * Pure functions: easy to test and shared by the overview and the reports.
 */

/** Statuses that count towards revenue (same rule as the API's dashboard). */
export const BILLABLE: AppointmentStatus[] = ['CONFIRMED', 'COMPLETED'];

const minutes = (a: Appointment) =>
  (new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60_000;

/** Every YYYY-MM-DD from `from` to `to`, both inclusive. */
export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

const weekdayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

/** Minutes a staff member is scheduled to work between two dates (inclusive). */
export function scheduledMinutes(member: StaffMember, from: string, to: string): number {
  const hours = member.workingHours ?? [];
  return eachDay(from, to).reduce((total, day) => {
    const weekday = weekdayOf(day);
    return (
      total +
      hours
        .filter((h) => h.weekday === weekday)
        .reduce((sum, h) => sum + (h.endMinute - h.startMinute), 0)
    );
  }, 0);
}

export interface Occupancy {
  staffId: string;
  name: string;
  color: string;
  bookedMinutes: number;
  scheduledMinutes: number;
  /** 0–1, or null when the person has no working hours in the period. */
  rate: number | null;
}

/** Booked vs. scheduled time per staff member. Cancelled appointments free their time. */
export function occupancyByStaff(
  staff: StaffMember[],
  appointments: Appointment[],
  from: string,
  to: string,
): Occupancy[] {
  return staff.map((member) => {
    const booked = appointments
      .filter((a) => a.staff.id === member.id && a.status !== 'CANCELLED')
      .reduce((sum, a) => sum + minutes(a), 0);
    const scheduled = scheduledMinutes(member, from, to);
    return {
      staffId: member.id,
      name: member.name,
      color: member.color,
      bookedMinutes: booked,
      scheduledMinutes: scheduled,
      rate: scheduled > 0 ? Math.min(booked / scheduled, 1) : null,
    };
  });
}

/** Overall occupancy across a list of per-staff results. */
export function totalOccupancy(rows: Occupancy[]): number | null {
  const scheduled = rows.reduce((s, r) => s + r.scheduledMinutes, 0);
  if (scheduled === 0) return null;
  return Math.min(rows.reduce((s, r) => s + r.bookedMinutes, 0) / scheduled, 1);
}

export interface DayTotals {
  date: string;
  appointments: number;
  revenue: number;
}

/** Appointments (excluding cancelled) and revenue per local day. */
export function totalsByDay(
  appointments: Appointment[],
  from: string,
  to: string,
  timeZone = DEFAULT_TZ,
): DayTotals[] {
  const rows = new Map(eachDay(from, to).map((d) => [d, { date: d, appointments: 0, revenue: 0 }]));
  for (const a of appointments) {
    const row = rows.get(toLocalDate(new Date(a.startsAt), timeZone));
    if (!row) continue;
    if (a.status !== 'CANCELLED') row.appointments += 1;
    if (BILLABLE.includes(a.status)) row.revenue += a.price;
  }
  return [...rows.values()];
}

export interface ServiceTotals {
  serviceId: string;
  name: string;
  appointments: number;
  revenue: number;
}

/** Services ranked by number of (non-cancelled) appointments. */
export function topServices(appointments: Appointment[]): ServiceTotals[] {
  const rows = new Map<string, ServiceTotals>();
  for (const a of appointments) {
    if (a.status === 'CANCELLED') continue;
    const row = rows.get(a.service.id) ?? {
      serviceId: a.service.id,
      name: a.service.name,
      appointments: 0,
      revenue: 0,
    };
    row.appointments += 1;
    if (BILLABLE.includes(a.status)) row.revenue += a.price;
    rows.set(a.service.id, row);
  }
  return [...rows.values()].sort(
    (x, y) => y.appointments - x.appointments || y.revenue - x.revenue,
  );
}

/** Count of appointments per status. */
export function countByStatus(appointments: Appointment[]): Record<AppointmentStatus, number> {
  const counts: Record<AppointmentStatus, number> = {
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    NO_SHOW: 0,
  };
  for (const a of appointments) counts[a.status] += 1;
  return counts;
}

export const revenueOf = (appointments: Appointment[]) =>
  appointments.filter((a) => BILLABLE.includes(a.status)).reduce((s, a) => s + a.price, 0);

export const formatPercent = (rate: number | null) =>
  rate === null ? '—' : `${Math.round(rate * 100)}%`;
