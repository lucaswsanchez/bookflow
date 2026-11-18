import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../auth/useAuth';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Section,
  Segmented,
  Skeleton,
  Stat,
  Table,
  Td,
  Th,
} from '../../components/ui';
import { api } from '../../lib/api';
import { downloadAppointmentsCsv } from '../../lib/download';
import { DEFAULT_TZ, formatDay, formatPrice, toLocalDate } from '../../lib/format';
import {
  BILLABLE,
  countByStatus,
  formatPercent,
  occupancyByStaff,
  revenueOf,
  topServices,
  totalOccupancy,
  totalsByDay,
} from '../../lib/metrics';
import { PERIOD_LABELS, resolvePeriod } from '../../lib/periods';
import { STATUS_LABELS, STATUS_TONES } from '../../lib/status';
import type { Appointment, AppointmentStatus, StaffMember } from '../../lib/types';

type ReportPeriod = 'week' | 'last30' | 'month' | 'prevMonth';
const PERIODS: ReportPeriod[] = ['week', 'last30', 'month', 'prevMonth'];

const compact = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 });

/** Business reports computed from the appointments the API returns for the period. */
export default function ReportsPage() {
  const { user } = useAuth();
  const tz = user?.business.timezone ?? DEFAULT_TZ;
  const today = toLocalDate(new Date(), tz);
  const [periodKey, setPeriodKey] = useState<ReportPeriod>('week');
  const [metric, setMetric] = useState<'revenue' | 'appointments'>('revenue');
  const [exporting, setExporting] = useState(false);
  const period = resolvePeriod(periodKey, today);

  const appointments = useQuery({
    queryKey: ['appointments', period.from, period.to, ''],
    queryFn: () => api<Appointment[]>('/appointments', { query: { ...period } }),
  });
  const staff = useQuery({ queryKey: ['staff'], queryFn: () => api<StaffMember[]>('/staff') });

  const report = useMemo(() => {
    if (!appointments.data || !staff.data) return null;
    const list = appointments.data;
    const counts = countByStatus(list);
    const total = list.length;
    const billable = list.filter((a) => BILLABLE.includes(a.status));
    const occupancy = occupancyByStaff(staff.data, list, period.from, period.to);
    const revenueByStaff = new Map<string, number>();
    for (const a of billable)
      revenueByStaff.set(a.staff.id, (revenueByStaff.get(a.staff.id) ?? 0) + a.price);
    return {
      total,
      active: total - counts.CANCELLED,
      counts,
      revenue: revenueOf(list),
      averageTicket: billable.length ? revenueOf(list) / billable.length : 0,
      cancellationRate: total ? counts.CANCELLED / total : null,
      noShowRate: total ? counts.NO_SHOW / total : null,
      occupancy,
      totalOccupancy: totalOccupancy(occupancy),
      revenueByStaff,
      days: totalsByDay(list, period.from, period.to, tz),
      services: topServices(list),
    };
  }, [appointments.data, staff.data, period.from, period.to, tz]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadAppointmentsCsv(period);
    } finally {
      setExporting(false);
    }
  };

  const error = appointments.error ?? staff.error;

  return (
    <div data-testid="reports-page">
      <PageHeader
        title="Reports"
        description={`${formatDay(period.from, { month: 'long' })} – ${formatDay(period.to, { month: 'long' })}`}
        actions={
          <>
            <Segmented
              label="Period"
              value={periodKey}
              onChange={setPeriodKey}
              options={PERIODS.map((p) => ({
                value: p,
                label: PERIOD_LABELS[p],
                testId: `report-period-${p}`,
              }))}
            />
            <Button
              variant="secondary"
              onClick={() => void exportCsv()}
              loading={exporting}
              data-testid="reports-export"
            >
              <Download className="size-4" aria-hidden /> Export CSV
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={() => void appointments.refetch()} />
      ) : !report ? (
        <div className="space-y-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : report.total === 0 ? (
        <EmptyState
          testId="reports-empty"
          title="No appointments in this period"
          description="Pick another period to see reports."
        />
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
            {[
              {
                label: 'Revenue',
                value: formatPrice(report.revenue),
                hint: 'Confirmed + completed',
                testId: 'report-revenue',
                tone: 'accent' as const,
              },
              {
                label: 'Appointments',
                value: report.active,
                hint: `${report.counts.COMPLETED} completed`,
                testId: 'report-appointments',
              },
              {
                label: 'Average ticket',
                value: formatPrice(Math.round(report.averageTicket)),
                hint: 'Per billable appointment',
                testId: 'report-average-ticket',
              },
              {
                label: 'Occupancy',
                value: formatPercent(report.totalOccupancy),
                hint: 'Of working hours',
                testId: 'report-occupancy',
              },
              {
                label: 'Cancellations',
                value: formatPercent(report.cancellationRate),
                hint: `${report.counts.CANCELLED} cancelled`,
                testId: 'report-cancellations',
              },
              {
                label: 'No-shows',
                value: formatPercent(report.noShowRate),
                hint: `${report.counts.NO_SHOW} clients didn't come`,
                testId: 'report-no-shows',
              },
            ].map((k) => (
              <div key={k.label} className="bg-surface p-5">
                <Stat {...k} />
              </div>
            ))}
          </div>

          <Section
            title={metric === 'revenue' ? 'Revenue per day' : 'Appointments per day'}
            description="Cancelled appointments are excluded"
            action={
              <Segmented
                label="Chart metric"
                value={metric}
                onChange={setMetric}
                options={[
                  { value: 'revenue', label: 'Revenue' },
                  { value: 'appointments', label: 'Appointments' },
                ]}
              />
            }
            testId="report-daily-chart"
          >
            <div className="h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.days} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e8e9e3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#758078' }}
                    tickFormatter={(d: string) => String(Number(d.slice(8)))}
                    interval={report.days.length > 14 ? 1 : 0}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tick={{ fontSize: 11, fill: '#758078' }}
                    allowDecimals={false}
                    tickFormatter={(v: number) =>
                      metric === 'revenue' ? compact.format(v) : String(v)
                    }
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f0ea' }}
                    contentStyle={{
                      borderRadius: 6,
                      border: '1px solid #e8e9e3',
                      boxShadow: '0 12px 32px -12px rgb(23 61 50 / 0.25)',
                      fontSize: 12,
                    }}
                    labelFormatter={(d) => formatDay(String(d), { month: 'long' })}
                    formatter={(v) => [
                      metric === 'revenue' ? formatPrice(Number(v)) : `${v}`,
                      metric === 'revenue' ? 'Revenue' : 'Appointments',
                    ]}
                  />
                  <Bar
                    dataKey={metric}
                    fill="#173d32"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <div className="grid gap-12 lg:grid-cols-2">
            <Section title="Most booked services" testId="report-services">
              <Table className="mt-1">
                <thead>
                  <tr>
                    <Th>Service</Th>
                    <Th className="text-right">Appts</Th>
                    <Th className="text-right">Revenue</Th>
                  </tr>
                </thead>
                <tbody>
                  {report.services.map((s) => (
                    <tr key={s.serviceId}>
                      <Td>
                        <p className="font-semibold">{s.name}</p>
                        <div className="mt-1.5 h-1 rounded-full bg-subtle">
                          <div
                            className="h-full rounded-full bg-sage"
                            style={{
                              width: `${(s.appointments / report.services[0].appointments) * 100}%`,
                            }}
                          />
                        </div>
                      </Td>
                      <Td className="tabular text-right">{s.appointments}</Td>
                      <Td className="tabular text-right">{formatPrice(s.revenue)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Section>

            <Section
              title="Team"
              description="Occupancy and revenue per professional"
              testId="report-team"
            >
              <ul className="divide-y divide-line">
                {report.occupancy.map((o) => (
                  <li key={o.staffId} className="py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={o.name} color={o.color} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate font-semibold">{o.name}</p>
                          <p className="tabular text-sm font-bold">
                            {formatPrice(report.revenueByStaff.get(o.staffId) ?? 0)}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-1.5 flex-1 rounded-full bg-subtle">
                            <div
                              className="h-full rounded-full bg-moss"
                              style={{ width: `${Math.round((o.rate ?? 0) * 100)}%` }}
                            />
                          </div>
                          <span className="tabular w-10 text-right text-xs font-semibold text-ink-soft">
                            {formatPercent(o.rate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <p className="eyebrow mb-3">Status</p>
                <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                  {(Object.keys(report.counts) as AppointmentStatus[]).map(
                    (s) =>
                      report.counts[s] > 0 && (
                        <div
                          key={s}
                          className={STATUS_TONES[s].dot}
                          style={{ width: `${(report.counts[s] / report.total) * 100}%` }}
                        />
                      ),
                  )}
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
                  {(Object.keys(report.counts) as AppointmentStatus[]).map((s) => (
                    <li key={s} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-ink-soft">
                        <span
                          className={clsx('size-2 rounded-full', STATUS_TONES[s].dot)}
                          aria-hidden
                        />
                        {STATUS_LABELS[s]}
                      </span>
                      <span className="tabular font-bold">{report.counts[s]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
