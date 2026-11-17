import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CalendarRange, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Card, EmptyState, ErrorState, Spinner, StatusBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDay, formatPrice, formatTime, toLocalDate } from '../../lib/format';
import type { DashboardSummary } from '../../lib/types';
import { PageHeader } from './AdminLayout';

export default function DashboardPage() {
  const { user } = useAuth();
  const summary = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardSummary>('/dashboard/summary'),
  });

  const firstName = user?.name.split(' ')[0];

  return (
    <>
      <PageHeader
        title={`Hi, ${firstName} 👋`}
        description={
          user?.role === 'STAFF'
            ? 'Here is your agenda at a glance.'
            : `Here is how ${user?.business.name} is doing.`
        }
      />
      {summary.isLoading && <Spinner />}
      {summary.isError && (
        <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />
      )}
      {summary.data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              icon={CalendarDays}
              label="Appointments today"
              value={summary.data.today.appointments}
              hint={`${summary.data.today.byStatus.COMPLETED ?? 0} completed`}
              testId="stat-today-appointments"
            />
            <Stat
              icon={CalendarRange}
              label="Appointments this week"
              value={summary.data.week.appointments}
              hint={`${formatDay(summary.data.week.from, { weekday: undefined })} – ${formatDay(summary.data.week.to, { weekday: undefined })}`}
              testId="stat-week-appointments"
            />
            <Stat
              icon={Wallet}
              label="Estimated revenue this week"
              value={formatPrice(summary.data.week.estimatedRevenue)}
              hint={`Today: ${formatPrice(summary.data.today.estimatedRevenue)}`}
              testId="stat-week-revenue"
            />
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Next appointments</h2>
              <Link to="/app/agenda" className="text-sm font-medium text-brand-700 hover:underline">
                Open agenda
              </Link>
            </div>
            {summary.data.upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming appointments"
                description="New bookings will show up here."
              />
            ) : (
              <ul className="divide-y divide-slate-100" data-testid="upcoming-list">
                {summary.data.upcoming.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-4 py-3"
                    data-testid="upcoming-item"
                  >
                    <div className="w-20 shrink-0 text-sm">
                      <p className="font-semibold text-slate-900">
                        {formatTime(a.startsAt, summary.data.timezone)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDay(toLocalDate(new Date(a.startsAt), summary.data.timezone))}
                      </p>
                    </div>
                    <span
                      className="h-8 w-1 rounded-full"
                      style={{ backgroundColor: a.staff.color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{a.client.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {a.service.name} · {a.staff.name}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  testId,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  testId: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon className="size-4 text-brand-600" />
        {label}
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900" data-testid={testId}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}
