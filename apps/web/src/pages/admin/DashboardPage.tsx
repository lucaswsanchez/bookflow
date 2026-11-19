import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowRight, ArrowUpRight, CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { AppointmentDetail } from '../../components/AppointmentDetail';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Section,
  Skeleton,
  Stat,
  StatusBadge,
} from '../../components/ui';
import { api } from '../../lib/api';
import {
  DEFAULT_TZ,
  formatDay,
  formatPrice,
  formatTime,
  minutesOfDay,
  minutesToTime,
  toLocalDate,
} from '../../lib/format';
import {
  countByStatus,
  formatPercent,
  occupancyByStaff,
  totalOccupancy,
  totalsByDay,
} from '../../lib/metrics';
import { STATUS_LABELS, STATUS_TONES } from '../../lib/status';
import type {
  Appointment,
  AppointmentStatus,
  DashboardSummary,
  StaffMember,
} from '../../lib/types';

const greeting = (hour: number) =>
  hour < 12 ? 'Good morning' : hour < 20 ? 'Good afternoon' : 'Good evening';

const weekdayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

/** Re-render every minute so "now" and "in 25 min" stay current. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const tz = user?.business.timezone ?? DEFAULT_TZ;
  const isStaff = user?.role === 'STAFF';
  const [selected, setSelected] = useState<Appointment | null>(null);
  const navigate = useNavigate();
  const now = useNow();

  const summary = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardSummary>('/dashboard/summary'),
  });
  const week = summary.data?.week;
  const weekAppointments = useQuery({
    queryKey: ['appointments', week?.from, week?.to, ''],
    queryFn: () =>
      api<Appointment[]>('/appointments', { query: { from: week!.from, to: week!.to } }),
    enabled: !!week,
  });
  const staff = useQuery({ queryKey: ['staff'], queryFn: () => api<StaffMember[]>('/staff') });

  const today = toLocalDate(now, tz);
  const nowMinute = minutesOfDay(now.toISOString(), tz);
  const hour = Math.floor(nowMinute / 60);

  const insights = useMemo(() => {
    if (!week || !weekAppointments.data || !staff.data) return null;
    const people = (isStaff ? staff.data.filter((s) => s.id === user?.staffId) : staff.data).filter(
      (s) => s.active !== false,
    );
    const all = weekAppointments.data;
    const todays = all.filter((a) => toLocalDate(new Date(a.startsAt), tz) === today);
    const occupancy = occupancyByStaff(people, all, week.from, week.to);
    const todayOccupancy = occupancyByStaff(people, todays, today, today);
    return {
      people,
      todays,
      days: totalsByDay(all, week.from, week.to, tz),
      occupancy,
      total: totalOccupancy(occupancy),
      today: totalOccupancy(todayOccupancy),
      remaining: todays
        .filter((a) => a.status === 'CONFIRMED' && new Date(a.startsAt).getTime() > now.getTime())
        .sort((x, y) => x.startsAt.localeCompare(y.startsAt)),
    };
  }, [week, weekAppointments.data, staff.data, isStaff, user?.staffId, tz, today, now]);

  const firstName = user?.name.split(' ')[0];
  const s = summary.data;

  return (
    <>
      <PageHeader
        eyebrow={formatDay(today, { weekday: 'long', month: 'long' })}
        title={`${greeting(hour)}, ${firstName}`}
        description={
          isStaff
            ? 'Your day and week at a glance.'
            : `Operations for ${user?.business.name.split(/\s+[—–-]\s+/)[0]}.`
        }
        actions={
          <>
            {!isStaff && (
              <a
                href={`/book/${user?.business.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-ink-soft hover:bg-subtle hover:text-ink"
              >
                Booking page <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            )}
            <Button variant="secondary" onClick={() => navigate('/app/agenda')}>
              <CalendarDays className="size-4" aria-hidden /> Open agenda
            </Button>
          </>
        }
      />

      {summary.isError ? (
        <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />
      ) : (
        <div className="space-y-8">
          {/* KPIs: today's revenue leads; three supporting figures, no duplicates. */}
          <div className="grid overflow-hidden rounded-lg border border-line bg-surface shadow-soft lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
            <div className="flex flex-col justify-between gap-5 bg-night px-5 py-5 text-night-text sm:px-6">
              {s ? (
                <>
                  <div>
                    <p className="eyebrow text-night-muted">Revenue today</p>
                    <p
                      className="tabular mt-2.5 text-[38px] leading-none font-semibold tracking-[-0.03em] text-white"
                      data-testid="stat-today-revenue"
                    >
                      {formatPrice(s.today.estimatedRevenue)}
                    </p>
                    <p className="mt-2 text-[13px] text-night-muted">Confirmed and completed</p>
                  </div>
                  <p className="flex flex-wrap items-baseline gap-x-2 border-t border-night-line pt-3 text-[13px] text-night-muted">
                    This week
                    <span
                      className="tabular font-medium text-white"
                      data-testid="stat-week-revenue"
                    >
                      {formatPrice(s.week.estimatedRevenue)}
                    </span>
                    ·
                    <span>
                      <span
                        className="tabular text-night-text"
                        data-testid="stat-week-appointments"
                      >
                        {s.week.appointments}
                      </span>{' '}
                      appointments
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <Skeleton className="h-3 w-24 bg-night-3" />
                  <Skeleton className="mt-3 h-9 w-40 bg-night-3" />
                </>
              )}
            </div>
            <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {s ? (
                <>
                  <Kpi>
                    <Stat
                      label="Appointments today"
                      value={s.today.appointments}
                      hint={`${s.today.byStatus.COMPLETED ?? 0} completed · ${s.today.byStatus.NO_SHOW ?? 0} no-show`}
                      testId="stat-today-appointments"
                    />
                  </Kpi>
                  <Kpi>
                    <Stat
                      label="Remaining today"
                      value={insights ? insights.remaining.length : '—'}
                      hint={
                        insights
                          ? insights.remaining[0]
                            ? `Next at ${formatTime(insights.remaining[0].startsAt, tz)}`
                            : 'Nothing left for today'
                          : undefined
                      }
                      testId="stat-to-attend"
                    />
                  </Kpi>
                  <Kpi>
                    <Stat
                      label="Occupancy today"
                      value={insights ? formatPercent(insights.today) : '—'}
                      hint={insights ? `${formatPercent(insights.total)} this week` : undefined}
                      testId="stat-today-occupancy"
                    />
                  </Kpi>
                </>
              ) : (
                Array.from({ length: 3 }, (_, i) => (
                  <Kpi key={i}>
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-3 h-6 w-16" />
                  </Kpi>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Left: today's schedule, then the week in one band */}
            <div className="min-w-0 space-y-8">
              <Section
                title="Today’s schedule"
                description={
                  insights
                    ? `${insights.todays.filter((a) => a.status !== 'CANCELLED').length} appointments · ${insights.people.length} ${insights.people.length === 1 ? 'professional' : 'professionals'}`
                    : undefined
                }
                action={
                  <Link
                    to="/app/agenda"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-ink hover:underline"
                  >
                    Full agenda <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                }
                testId="today-schedule"
              >
                {insights ? (
                  <DayTimeline
                    people={insights.people}
                    appointments={insights.todays}
                    date={today}
                    nowMinute={nowMinute}
                    tz={tz}
                    onSelect={setSelected}
                  />
                ) : (
                  <Skeleton className="h-56 w-full" />
                )}
              </Section>

              <Section
                title="This week"
                action={
                  isStaff ? undefined : (
                    <Link
                      to="/app/reports"
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-ink hover:underline"
                    >
                      Reports <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  )
                }
              >
                <div className="grid grid-cols-1 divide-y divide-line rounded-lg border border-line bg-surface shadow-soft md:grid-cols-3 md:divide-x md:divide-y-0">
                  <div className="p-4 sm:p-5" data-testid="occupancy">
                    <p className="eyebrow mb-3">Occupancy</p>
                    {insights ? (
                      insights.occupancy.length === 0 ? (
                        <p className="text-sm text-muted">No working hours set.</p>
                      ) : (
                        <ul className="space-y-3.5">
                          {insights.occupancy.map((o) => (
                            <li key={o.staffId}>
                              <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                                <span className="flex min-w-0 items-center gap-2 font-medium">
                                  <Avatar name={o.name} color={o.color} size="sm" />
                                  <span className="truncate">{o.name}</span>
                                </span>
                                <span className="tabular shrink-0 text-ink-soft">
                                  {formatPercent(o.rate)}
                                </span>
                              </div>
                              <Meter value={o.rate ?? 0} />
                              <p className="tabular mt-1 text-[11px] text-muted">
                                {Math.round(o.bookedMinutes / 60)} h of{' '}
                                {Math.round(o.scheduledMinutes / 60)} h
                              </p>
                            </li>
                          ))}
                        </ul>
                      )
                    ) : (
                      <ListSkeleton rows={3} />
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="eyebrow mb-3">Appointments per day</p>
                    {insights ? (
                      <WeekBars days={insights.days} today={today} />
                    ) : (
                      <Skeleton className="h-40 w-full" />
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="eyebrow mb-3">By status</p>
                    {weekAppointments.data ? (
                      <StatusBreakdown counts={countByStatus(weekAppointments.data)} />
                    ) : (
                      <ListSkeleton rows={4} />
                    )}
                  </div>
                </div>
              </Section>
            </div>

            <Section title="Up next">
              {!s ? (
                <ListSkeleton />
              ) : s.upcoming.length === 0 ? (
                <EmptyState
                  title="No upcoming appointments"
                  description="New bookings will show up here."
                />
              ) : (
                <ul
                  className="overflow-hidden rounded-lg border border-line bg-surface shadow-soft"
                  data-testid="upcoming-list"
                >
                  {s.upcoming.map((a, i) => (
                    <li
                      key={a.id}
                      data-testid="upcoming-item"
                      className="border-b border-line last:border-b-0"
                    >
                      {i === 0 ? (
                        <NextUp
                          a={a}
                          tz={tz}
                          today={today}
                          now={now}
                          onClick={() => setSelected(a)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelected(a)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-canvas"
                        >
                          <div className="w-14 shrink-0">
                            <p className="mono text-[13px] font-medium">
                              {formatTime(a.startsAt, tz)}
                            </p>
                            <p className="text-[11px] text-muted">
                              {relativeDay(toLocalDate(new Date(a.startsAt), tz), today)}
                            </p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium">{a.client.name}</p>
                            <p className="truncate text-xs text-muted">{a.service.name}</p>
                          </div>
                          <span title={a.staff.name}>
                            <Avatar name={a.staff.name} color={a.staff.color} size="sm" />
                            <span className="sr-only">{a.staff.name}</span>
                          </span>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
      )}

      <AppointmentDetail appointment={selected} timeZone={tz} onClose={() => setSelected(null)} />
    </>
  );
}

function Kpi({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 px-4 py-5 sm:px-5">{children}</div>;
}

function NextUp({
  a,
  tz,
  today,
  now,
  onClick,
}: {
  a: Appointment;
  tz: string;
  today: string;
  now: Date;
  onClick: () => void;
}) {
  const minutes = Math.round((new Date(a.startsAt).getTime() - now.getTime()) / 60_000);
  const when =
    minutes <= 0
      ? 'Now'
      : minutes < 60
        ? `In ${minutes} min`
        : relativeDay(toLocalDate(new Date(a.startsAt), tz), today);
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full bg-night px-4 py-4 text-left text-night-text transition-colors hover:bg-night-2"
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow text-signal">{when}</span>
        <StatusBadge status={a.status} />
      </div>
      <p className="mono mt-2 text-[26px] leading-none font-medium text-white">
        {formatTime(a.startsAt, tz)}
      </p>
      <p className="mt-2.5 truncate text-[15px] font-medium text-white">{a.client.name}</p>
      <div className="mt-1 flex items-center justify-between gap-3 text-[13px] text-night-muted">
        <span className="truncate">
          {a.service.name} · {a.service.durationMinutes} min
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Avatar name={a.staff.name} color={a.staff.color} size="sm" />
          {a.staff.name.split(' ')[0]}
        </span>
      </div>
    </button>
  );
}

/**
 * Today at a glance: one lane per professional across the working day.
 * Hatched = outside working hours; blocks open the appointment detail.
 */
function DayTimeline({
  people,
  appointments,
  date,
  nowMinute,
  tz,
  onSelect,
}: {
  people: StaffMember[];
  appointments: Appointment[];
  date: string;
  nowMinute: number;
  tz: string;
  onSelect: (a: Appointment) => void;
}) {
  const weekday = weekdayOf(date);
  const hours = people.flatMap((p) => (p.workingHours ?? []).filter((h) => h.weekday === weekday));
  const visible = appointments.filter((a) => a.status !== 'CANCELLED');

  if (hours.length === 0 && visible.length === 0) {
    return (
      <EmptyState
        title="Closed today"
        description="Nobody is scheduled to work and there are no appointments."
        testId="timeline-empty"
      />
    );
  }

  const starts = [
    ...hours.map((h) => h.startMinute),
    ...visible.map((a) => minutesOfDay(a.startsAt, tz)),
  ];
  const ends = [
    ...hours.map((h) => h.endMinute),
    ...visible.map((a) => minutesOfDay(a.endsAt, tz)),
  ];
  const start = Math.floor(Math.min(...starts) / 60) * 60;
  const end = Math.ceil(Math.max(...ends) / 60) * 60;
  const span = end - start;
  const pct = (m: number) => `${((m - start) / span) * 100}%`;
  const ticks = Array.from({ length: span / 60 + 1 }, (_, i) => start + i * 60);
  const showNow = nowMinute >= start && nowMinute <= end;

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-soft">
      <div className="min-w-[640px]">
        {/* Hour ruler */}
        <div className="grid grid-cols-[132px_1fr] border-b border-line">
          <div />
          <div className="relative h-8">
            {ticks.slice(1, -1).map((t) => (
              <span
                key={t}
                className="mono absolute top-2.5 -translate-x-1/2 text-[10.5px] text-muted"
                style={{ left: pct(t) }}
              >
                {minutesToTime(t)}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          {people.map((p) => {
            const ranges = (p.workingHours ?? []).filter((h) => h.weekday === weekday);
            const mine = visible.filter((a) => a.staff.id === p.id);
            const next = mine.find(
              (a) => a.status === 'CONFIRMED' && minutesOfDay(a.startsAt, tz) >= nowMinute,
            );
            return (
              <div
                key={p.id}
                className="grid grid-cols-[132px_1fr] border-b border-line last:border-b-0"
                data-testid="timeline-lane"
              >
                <div className="flex items-center gap-2 border-r border-line px-3 py-2">
                  <Avatar name={p.name} color={p.color} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{p.name.split(' ')[0]}</p>
                    <p className="text-[11px] text-muted">
                      {mine.length} {mine.length === 1 ? 'appt' : 'appts'}
                      {next && (
                        <>
                          <span className="mono block text-ink-soft">
                            {formatTime(next.startsAt, tz)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="hatch relative h-[76px]">
                  {ranges.map((r) => (
                    <div
                      key={r.startMinute}
                      className="absolute inset-y-0 bg-surface"
                      style={{
                        left: pct(r.startMinute),
                        width: `${((r.endMinute - r.startMinute) / span) * 100}%`,
                      }}
                    />
                  ))}
                  {ticks.slice(1, -1).map((t) => (
                    <div
                      key={t}
                      className="absolute inset-y-0 border-l border-line/70"
                      style={{ left: pct(t) }}
                      aria-hidden
                    />
                  ))}
                  {mine.map((a) => {
                    const from = minutesOfDay(a.startsAt, tz);
                    const to = minutesOfDay(a.endsAt, tz);
                    const roomy = (to - from) / span > 0.08;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onSelect(a)}
                        data-testid="timeline-block"
                        data-status={a.status}
                        title={`${formatTime(a.startsAt, tz)} ${a.client.name} · ${a.service.name} (${STATUS_LABELS[a.status]})`}
                        className={clsx(
                          'absolute top-1.5 bottom-1.5 overflow-hidden rounded-[4px] border-l-2 px-1 text-left text-[11px] leading-tight transition-[filter] hover:z-10 hover:brightness-95',
                          STATUS_TONES[a.status].block,
                        )}
                        style={{
                          left: `calc(${pct(from)} + 1px)`,
                          width: `calc(${((to - from) / span) * 100}% - 2px)`,
                        }}
                      >
                        {roomy && (
                          <>
                            <span className="mono block pt-1 font-medium">
                              {formatTime(a.startsAt, tz)}
                            </span>
                            <span className="block truncate opacity-80">
                              {a.client.name.split(' ')[0]}
                            </span>
                          </>
                        )}
                        <span className="sr-only">
                          {formatTime(a.startsAt, tz)} {a.client.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {showNow && (
            <div
              className="pointer-events-none absolute inset-y-0 right-0 left-[132px]"
              aria-hidden
            >
              <div
                className="absolute inset-y-0 w-px bg-signal"
                style={{ left: pct(nowMinute) }}
                data-testid="timeline-now"
              >
                <span className="absolute -top-px -left-[3px] size-[7px] rounded-full bg-signal" />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-3 py-2 text-[11px] text-muted">
        {(['CONFIRMED', 'COMPLETED', 'NO_SHOW'] as AppointmentStatus[]).map((st) => (
          <span key={st} className="flex items-center gap-1.5">
            <span className={clsx('size-1.5 rounded-full', STATUS_TONES[st].dot)} aria-hidden />
            {STATUS_LABELS[st]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="hatch size-2.5 rounded-[2px] border border-line-strong" aria-hidden />
          Off hours
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-px bg-signal" aria-hidden />
          Now
        </span>
      </div>
    </div>
  );
}

function Meter({ value }: { value: number }) {
  return (
    <div className="h-1 overflow-hidden rounded-full bg-subtle">
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-1">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

function WeekBars({
  days,
  today,
}: {
  days: { date: string; appointments: number; revenue: number }[];
  today: string;
}) {
  const max = Math.max(1, ...days.map((d) => d.appointments));
  return (
    <div className="grid h-40 grid-cols-7 items-end gap-2" data-testid="week-bars">
      {days.map((d) => (
        <div key={d.date} className="flex h-full flex-col items-center justify-end gap-1.5">
          <span className="tabular text-[11px] text-ink-soft">{d.appointments}</span>
          <div
            className={clsx(
              'w-full max-w-9 rounded-t-[3px] transition-[height] duration-500',
              d.date === today ? 'bg-accent' : d.date < today ? 'bg-night-3' : 'bg-accent-100',
            )}
            style={{ height: `${Math.max((d.appointments / max) * 100, 2)}%` }}
            title={`${d.appointments} appointments · ${formatPrice(d.revenue)}`}
          />
          <span
            className={clsx(
              'tabular text-[10.5px] uppercase',
              d.date === today ? 'font-medium text-accent-ink' : 'text-muted',
            )}
          >
            {formatDay(d.date, { weekday: 'short', month: undefined, day: undefined })}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusBreakdown({ counts }: { counts: Record<AppointmentStatus, number> }) {
  const order: AppointmentStatus[] = ['COMPLETED', 'CONFIRMED', 'NO_SHOW', 'CANCELLED'];
  const total = order.reduce((s, k) => s + counts[k], 0) || 1;
  return (
    <div data-testid="status-breakdown">
      <div className="mb-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {order.map(
          (s) =>
            counts[s] > 0 && (
              <div
                key={s}
                className={STATUS_TONES[s].dot}
                style={{ width: `${(counts[s] / total) * 100}%` }}
              />
            ),
        )}
      </div>
      <dl className="divide-y divide-line">
        {order.map((s) => (
          <div key={s} className="flex items-center justify-between py-2 text-[13px]">
            <dt className="flex items-center gap-2 text-ink-soft">
              <span className={clsx('size-1.5 rounded-full', STATUS_TONES[s].dot)} aria-hidden />
              {STATUS_LABELS[s]}
            </dt>
            <dd className="tabular" data-testid={`status-count-${s.toLowerCase()}`}>
              {counts[s]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function relativeDay(date: string, today: string) {
  if (date === today) return 'Today';
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (date === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow';
  return formatDay(date, { weekday: 'short' });
}
