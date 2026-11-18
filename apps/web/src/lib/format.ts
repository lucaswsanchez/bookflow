export const DEFAULT_TZ = 'America/Argentina/Buenos_Aires';

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/** 9000 → "$ 9.000" (Argentine format). */
export const formatPrice = (value: number) => currency.format(value);

export const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

/** YYYY-MM-DD of an instant in the given time zone. */
export function toLocalDate(date: Date, timeZone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Adds days to a YYYY-MM-DD string (calendar arithmetic, time-zone independent). */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing the given YYYY-MM-DD. */
export function startOfWeek(date: string): string {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay(); // 0 = Sun
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
}

/** Formats a YYYY-MM-DD calendar date, e.g. "Tue, Dec 1". */
export function formatDay(date: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(new Date(`${date}T12:00:00Z`));
}

/** Formats an ISO instant as local time, e.g. "09:30". */
export function formatTime(iso: string, timeZone = DEFAULT_TZ) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso));
}

/** Minutes since local midnight of an ISO instant in the given time zone. */
export function minutesOfDay(iso: string, timeZone = DEFAULT_TZ) {
  const [h, m] = formatTime(iso, timeZone).split(':').map(Number);
  return h * 60 + m;
}

export const minutesToTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** "Martín Acosta" → "martin-acosta" — used for stable data-testid values. */
export const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** "Barbería Costanera — Corrientes" → { name: "Barbería Costanera", place: "Corrientes" } */
export function splitBusinessName(full = '') {
  const [name, place] = full.split(/\s+[—–-]\s+/);
  return { name, place: place ?? null };
}
