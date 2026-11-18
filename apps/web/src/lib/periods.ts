import { addDays, startOfWeek } from './format';

export type PeriodKey = 'today' | 'next7' | 'week' | 'month' | 'last30' | 'prevMonth' | 'custom';

export interface Period {
  from: string;
  to: string;
}

const firstOfMonth = (date: string) => `${date.slice(0, 7)}-01`;
const lastOfMonth = (date: string) => {
  const [y, m] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};

/** Resolves a named period relative to `today` (YYYY-MM-DD in the business time zone). */
export function resolvePeriod(key: Exclude<PeriodKey, 'custom'>, today: string): Period {
  switch (key) {
    case 'today':
      return { from: today, to: today };
    case 'next7':
      return { from: today, to: addDays(today, 6) };
    case 'week': {
      const from = startOfWeek(today);
      return { from, to: addDays(from, 6) };
    }
    case 'month':
      return { from: firstOfMonth(today), to: lastOfMonth(today) };
    case 'last30':
      return { from: addDays(today, -29), to: today };
    case 'prevMonth': {
      const last = addDays(firstOfMonth(today), -1);
      return { from: firstOfMonth(last), to: last };
    }
  }
}

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: 'Today',
  next7: 'Next 7 days',
  week: 'This week',
  month: 'This month',
  last30: 'Last 30 days',
  prevMonth: 'Last month',
  custom: 'Custom range',
};
