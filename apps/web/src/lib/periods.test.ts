import { describe, expect, it } from 'vitest';
import { resolvePeriod } from './periods';

describe('resolvePeriod', () => {
  const today = '2026-12-03'; // Thursday

  it('resolves rolling and calendar periods', () => {
    expect(resolvePeriod('today', today)).toEqual({ from: today, to: today });
    expect(resolvePeriod('next7', today)).toEqual({ from: today, to: '2026-12-09' });
    expect(resolvePeriod('week', today)).toEqual({ from: '2026-11-30', to: '2026-12-06' });
    expect(resolvePeriod('last30', today)).toEqual({ from: '2026-11-04', to: today });
  });

  it('handles month boundaries, including February and year changes', () => {
    expect(resolvePeriod('month', '2028-02-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(resolvePeriod('prevMonth', '2027-01-15')).toEqual({
      from: '2026-12-01',
      to: '2026-12-31',
    });
  });
});
