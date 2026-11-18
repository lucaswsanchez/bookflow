import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { DEFAULT_TZ, formatDay, formatPrice, formatTime, toLocalDate } from '../../lib/format';
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

export default function DashboardPage() {
  const { user } = useAuth();
  const tz = user?.business.timezone ?? DEFAULT_TZ;
  const isStaff = user?.role === 'STAFF';
  const [selected, setSelected] = useState<Appointment | null>(null);
  const navigate = useNavigate();

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

  const today = toLocalDate(new Date(), tz);
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(
      new Date(),
    ),
  );

  const insights = useMemo(() => {
    if (!week || !weekAppointments.data || !staff.data) return null;
    const people = isStaff ? staff.data.filter((s) => s.id === user?.staffId) : staff.data;
    const occupancy = occupancyByStaff(people, weekAppointments.data, week.from, week.to);
    return {
      days: totalsByDay(weekAppointments.data, week.from, week.to, tz),
      occupancy,
      total: totalOccupancy(occupancy),
    };
  }, [week, weekAppointments.data, staff.data, isStaff, user?.staffId, tz]);

  const firstName = user?.name.split(' ')[0];

  return (
    <>
      <PageHeader
        eyebrow={formatDay(today, { weekday: 'long', month: 'long' })}
        title={`${greeting(hour)}, ${firstName}`}
        description={
          isStaff
            ? 'Your day and week at a glance.'
            : `Here is how ${user?.business.name} is doing.`
        }
        actions={
          <Button variant="secondary" onClick={() => navigate('/app/agenda')}>
            <CalendarDays className="size-4" aria-hidden /> Open agenda
          </Button>
        }
      />

      {summary.isError ? (
        <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />
      ) : (
        <div className="space-y-10">
          {/* KPI band */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
            {summary.data ? (
              <>
                <Kpi>
                  <Stat
                    tone="accent"
                    label="Revenue today"
                    value={formatPrice(summary.data.today.estimatedRevenue)}
                    hint="Confirmed and completed"
                    testId="stat-today-revenue"
                  />
                </Kpi>
                <Kpi>
                  <Stat
                    label="Booked today"
                    value={summary.data.today.appointments}
                    hint={`${summary.data.today.byStatus.COMPLETED ?? 0} completed · ${
                      summary.data.today.byStatus.CONFIRMED ?? 0
                    } to go`}
                    testId="stat-today-appointments"
                  />
                </Kpi>
                <Kpi>
                  <Stat
                    label="Revenue this week"
                    value={formatPrice(summary.data.week.estimatedRevenue)}
                    hint={`${formatDay(summary.data.week.from, { weekday: undefined })} – ${formatDay(
                      summary.data.week.to,
                      { weekday: undefined },
                    )}`}
                    testId="stat-week-revenue"
                  />
                </Kpi>
                <Kpi>
                  <Stat
                    label="Booked this week"
                    value={summary.data.week.appointments}
                    hint={insights ? `${formatPercent(insights.total)} occupancy` : 'Calculating…'}
                    testId="stat-week-appointments"
                  />
                </Kpi>
              </>
            ) : (
              Array.from({ length: 4 }, (_, i) => (
                <Kpi key={i}>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-3 h-7 w-28" />
                  <Skeleton className="mt-3 h-3 w-20" />
                </Kpi>
              ))
            )}
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-10">
              <Section
                title="Next appointments"
                description="Confirmed bookings coming up"
                action={
                  <Link
                    to="/app/agenda"
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-forest hover:underline"
                  >
                    Agenda <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                }
              >
                {!summary.data ? (
                  <ListSkeleton />
                ) : summary.data.upcoming.length === 0 ? (
                  <EmptyState
                    title="No upcoming appointments"
                    description="New bookings will show up here."
                  />
                ) : (
                  <ul className="divide-y divide-line" data-testid="upcoming-list">
                    {summary.data.upcoming.map((a) => (
                      <li key={a.id} data-testid="upcoming-item">
                        <button
                          type="button"
                          onClick={() => setSelected(a)}
                          className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-4 rounded-md px-2 py-3 text-left transition-colors hover:bg-surface"
                        >
                          <div className="w-16 shrink-0">
                            <p className="tabular text-[15px] font-bold">
                              {formatTime(a.startsAt, tz)}
                            </p>
                            <p className="text-xs text-muted">
                              {relativeDay(toLocalDate(new Date(a.startsAt), tz), today)}
                            </p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{a.client.name}</p>
                            <p className="truncate text-[13px] text-muted">{a.service.name}</p>
                          </div>
                          <div className="hidden items-center gap-2 text-[13px] text-ink-soft sm:flex">
                            <Avatar name={a.staff.name} color={a.staff.color} size="sm" />
                            {a.staff.name.split(' ')[0]}
                          </div>
                          <StatusBadge status={a.status} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="This week" description="Appointments per day">
                {insights ? (
                  <WeekBars days={insights.days} today={today} />
                ) : (
                  <Skeleton className="h-40 w-full" />
                )}
              </Section>
            </div>

            <div className="space-y-10">
              <Section
                title="Status this week"
                description={
                  summary.data ? `${summary.data.week.appointments} active appointments` : undefined
                }
              >
                {weekAppointments.data ? (
                  <StatusBreakdown counts={countByStatus(weekAppointments.data)} />
                ) : (
                  <ListSkeleton rows={4} />
                )}
              </Section>

              <Section
                title="Occupancy"
                description="Booked time vs. working hours this week"
                testId="occupancy"
              >
                {insights ? (
                  insights.occupancy.length === 0 ? (
                    <p className="text-sm text-muted">No working hours set.</p>
                  ) : (
                    <ul className="space-y-4">
                      {insights.occupancy.map((o) => (
                        <li key={o.staffId}>
                          <div className="mb-1.5 flex items-center justify-between text-[13px]">
                            <span className="flex items-center gap-2 font-semibold">
                              <Avatar name={o.name} color={o.color} size="sm" />
                              {o.name}
                            </span>
                            <span className="tabular font-bold">{formatPercent(o.rate)}</span>
                          </div>
                          <Meter value={o.rate ?? 0} />
                          <p className="mt-1 text-xs text-muted">
                            {Math.round(o.bookedMinutes / 60)} h booked of{' '}
                            {Math.round(o.scheduledMinutes / 60)} h
                          </p>
                        </li>
                      ))}
                    </ul>
                  )
                ) : (
                  <ListSkeleton rows={3} />
                )}
              </Section>
            </div>
          </div>
        </div>
      )}

      <AppointmentDetail appointment={selected} timeZone={tz} onClose={() => setSelected(null)} />
    </>
  );
}

function Kpi({ children }: { children: React.ReactNode }) {
  return <div className="bg-surface p-5 sm:p-6">{children}</div>;
}

function Meter({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-subtle">
      <div
        className="h-full rounded-full bg-moss transition-[width] duration-500"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 py-2">
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
    <div className="grid h-44 grid-cols-7 items-end gap-2 pt-4 sm:gap-4" data-testid="week-bars">
      {days.map((d) => (
        <div key={d.date} className="flex h-full flex-col items-center justify-end gap-2">
          <span className="tabular text-xs font-semibold text-ink-soft">{d.appointments}</span>
          <div
            className={clsx(
              'w-full max-w-12 rounded-t-sm transition-[height] duration-500',
              d.date === today ? 'bg-forest' : d.date < today ? 'bg-sage' : 'bg-sage-100',
            )}
            style={{ height: `${Math.max((d.appointments / max) * 100, 2)}%` }}
            title={`${d.appointments} appointments · ${formatPrice(d.revenue)}`}
          />
          <span
            className={clsx('text-xs', d.date === today ? 'font-bold text-forest' : 'text-muted')}
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
      <div className="mb-4 flex h-2 gap-0.5 overflow-hidden rounded-full">
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
          <div key={s} className="flex items-center justify-between py-2 text-sm">
            <dt className="flex items-center gap-2 text-ink-soft">
              <span className={clsx('size-2 rounded-full', STATUS_TONES[s].dot)} aria-hidden />
              {STATUS_LABELS[s]}
            </dt>
            <dd className="tabular font-bold" data-testid={`status-count-${s.toLowerCase()}`}>
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
