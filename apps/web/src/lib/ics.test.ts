import { describe, expect, it } from 'vitest';
import { bookingToIcs } from './ics';

describe('bookingToIcs', () => {
  it('builds a UTC calendar event with the booking code', () => {
    const ics = bookingToIcs(
      {
        code: 'BF-7K3P9Q',
        status: 'CONFIRMED',
        startsAt: '2026-12-01T12:00:00.000Z',
        endsAt: '2026-12-01T12:30:00.000Z',
        price: 9000,
        service: { name: 'Classic Haircut', durationMinutes: 30 },
        staff: { name: 'Martín Acosta' },
        clientName: 'Ana',
        business: {
          name: 'Barbería Costanera',
          address: 'Costanera 123, Corrientes',
          timezone: 'UTC',
        },
      },
      new Date('2026-11-17T10:00:00Z'),
    );
    expect(ics).toContain('DTSTART:20261201T120000Z');
    expect(ics).toContain('DTEND:20261201T123000Z');
    expect(ics).toContain('UID:BF-7K3P9Q@bookflow');
    expect(ics).toContain('LOCATION:Costanera 123\\, Corrientes');
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });
});
