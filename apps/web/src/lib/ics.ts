import type { BookingSummary } from './types';

const stamp = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
const escape = (value: string) => value.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

/** iCalendar (.ics) event for a confirmed booking, so clients can add it to their calendar. */
export function bookingToIcs(booking: BookingSummary, now = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BookFlow//Booking//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${booking.code}@bookflow`,
    `DTSTAMP:${stamp(now.toISOString())}`,
    `DTSTART:${stamp(booking.startsAt)}`,
    `DTEND:${stamp(booking.endsAt)}`,
    `SUMMARY:${escape(`${booking.service.name} — ${booking.business.name}`)}`,
    `DESCRIPTION:${escape(`With ${booking.staff.name}. Booking code: ${booking.code}`)}`,
    ...(booking.business.address ? [`LOCATION:${escape(booking.business.address)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export function downloadIcs(booking: BookingSummary) {
  const url = URL.createObjectURL(new Blob([bookingToIcs(booking)], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${booking.code}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
