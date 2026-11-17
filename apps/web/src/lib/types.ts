export type Role = 'ADMIN' | 'STAFF';
export type AppointmentStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Business {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  timezone: string;
  currency: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  active?: boolean;
}

export interface WorkingHours {
  id?: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
}

export interface StaffMember {
  id: string;
  name: string;
  title: string | null;
  color: string;
  active?: boolean;
  workingHours?: WorkingHours[];
  services?: { id: string; name: string }[];
  user?: { id: string; email: string } | null;
}

export interface Slot {
  start: string;
  end: string;
  time: string;
}

export interface Availability {
  date: string;
  timezone: string;
  slots: Slot[];
}

export interface BookingSummary {
  code: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  price: number;
  service: { name: string; durationMinutes: number };
  staff: { name: string };
  clientName: string;
  business: { name: string; address: string | null; timezone: string };
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  _count?: { appointments: number };
}

export interface Appointment {
  id: string;
  code: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  price: number;
  notes: string | null;
  service: { id: string; name: string; durationMinutes: number };
  staff: { id: string; name: string; color: string };
  client: { id: string; name: string; phone: string; email: string | null };
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  staffId: string | null;
  business: { id: string; name: string; slug: string; timezone: string };
}

export interface PeriodSummary {
  from: string;
  to: string;
  appointments: number;
  estimatedRevenue: number;
  byStatus: Partial<Record<AppointmentStatus, number>>;
}

export interface DashboardSummary {
  timezone: string;
  currency: string;
  today: PeriodSummary;
  week: PeriodSummary;
  upcoming: Appointment[];
}
