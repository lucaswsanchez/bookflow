import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Download, Search } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { AppointmentDetail } from '../../components/AppointmentDetail';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StatusBadge,
  Table,
  Td,
  Th,
} from '../../components/ui';
import { api } from '../../lib/api';
import { downloadAppointmentsCsv } from '../../lib/download';
import {
  DEFAULT_TZ,
  formatDay,
  formatDuration,
  formatPrice,
  formatTime,
  slugify,
  toLocalDate,
} from '../../lib/format';
import { revenueOf } from '../../lib/metrics';
import { PERIOD_LABELS, resolvePeriod, type PeriodKey } from '../../lib/periods';
import { STATUS_LABELS } from '../../lib/status';
import type { Appointment, AppointmentStatus, StaffMember } from '../../lib/types';

const PERIODS: PeriodKey[] = ['today', 'next7', 'week', 'month', 'last30', 'custom'];
const STATUSES: AppointmentStatus[] = ['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'];

/** Searchable list of appointments with filters and contextual status actions. */
export default function AppointmentsPage() {
  const { user } = useAuth();
  const tz = user?.business.timezone ?? DEFAULT_TZ;
  const isAdmin = user?.role === 'ADMIN';
  const today = toLocalDate(new Date(), tz);
  const desktop = useMediaQuery('(min-width: 768px)');

  const [periodKey, setPeriodKey] = useState<PeriodKey>('next7');
  const [custom, setCustom] = useState(() => resolvePeriod('next7', today));
  const [staffId, setStaffId] = useState('');
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [exporting, setExporting] = useState(false);

  const period = periodKey === 'custom' ? custom : resolvePeriod(periodKey, today);
  const validRange = period.from <= period.to;

  const staff = useQuery({
    queryKey: ['staff'],
    queryFn: () => api<StaffMember[]>('/staff'),
    enabled: isAdmin,
  });
  const appointments = useQuery({
    queryKey: ['appointments', period.from, period.to, staffId, status],
    queryFn: () =>
      api<Appointment[]>('/appointments', {
        query: { from: period.from, to: period.to, staffId, status: status || undefined },
      }),
    enabled: validRange,
  });

  const filtered = useMemo(() => {
    const term = slugify(search);
    const digits = search.replace(/\D/g, '');
    const list = appointments.data ?? [];
    if (!term) return list;
    return list.filter(
      (a) =>
        slugify(`${a.client.name} ${a.service.name} ${a.staff.name} ${a.code}`).includes(term) ||
        (digits.length >= 3 && a.client.phone.replace(/\D/g, '').includes(digits)),
    );
  }, [appointments.data, search]);

  const byDay = useMemo(() => {
    const groups = new Map<string, Appointment[]>();
    for (const a of filtered) {
      const day = toLocalDate(new Date(a.startsAt), tz);
      groups.set(day, [...(groups.get(day) ?? []), a]);
    }
    return [...groups.entries()];
  }, [filtered, tz]);

  const queryClient = useQueryClient();
  const complete = useMutation({
    mutationFn: (id: string) =>
      api<Appointment>(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: { status: 'COMPLETED' },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadAppointmentsCsv({ ...period, staffId, status: status || undefined });
    } finally {
      setExporting(false);
    }
  };

  const canComplete = (a: Appointment) =>
    a.status === 'CONFIRMED' && new Date(a.startsAt).getTime() <= Date.now();

  return (
    <div data-testid="appointments-page">
      <PageHeader
        title="Appointments"
        description={
          isAdmin ? 'Search, filter and update every booking.' : 'Search and update your bookings.'
        }
        actions={
          <Button
            variant="secondary"
            onClick={() => void exportCsv()}
            loading={exporting}
            disabled={!validRange}
            data-testid="appointments-export"
          >
            <Download className="size-4" aria-hidden /> Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <label className="relative">
          <span className="sr-only">Search appointments</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Client, phone, service or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="appointments-search"
          />
        </label>
        <Select
          aria-label="Period"
          value={periodKey}
          onChange={(e) => {
            const key = e.target.value as PeriodKey;
            if (key === 'custom') setCustom(period);
            setPeriodKey(key);
          }}
          data-testid="appointments-period"
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABELS[p]}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as AppointmentStatus | '')}
          data-testid="appointments-status-filter"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        {isAdmin ? (
          <Select
            aria-label="Professional"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            data-testid="appointments-staff-filter"
          >
            <option value="">All professionals</option>
            {staff.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        ) : (
          <div />
        )}
        {periodKey === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
            <Input
              type="date"
              aria-label="From"
              value={custom.from}
              onChange={(e) => e.target.value && setCustom({ ...custom, from: e.target.value })}
              className="w-auto"
              data-testid="appointments-from"
            />
            <span className="text-muted">to</span>
            <Input
              type="date"
              aria-label="To"
              value={custom.to}
              onChange={(e) => e.target.value && setCustom({ ...custom, to: e.target.value })}
              className="w-auto"
              data-testid="appointments-to"
            />
            {!validRange && (
              <p role="alert" className="text-xs font-medium text-danger">
                The start date must be before the end date.
              </p>
            )}
          </div>
        )}
      </div>

      {appointments.isError ? (
        <ErrorState message={appointments.error.message} onRetry={() => appointments.refetch()} />
      ) : appointments.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          testId="appointments-empty"
          title={search ? 'No matches' : 'No appointments'}
          description={
            search ? `Nothing matches “${search}” in this period.` : 'Try another period or status.'
          }
        />
      ) : (
        <>
          <p className="mb-3 text-[13px] text-muted" data-testid="appointments-summary">
            <span className="font-semibold text-ink">{filtered.length}</span> appointment
            {filtered.length === 1 ? '' : 's'} ·{' '}
            <span className="font-semibold text-ink">{formatPrice(revenueOf(filtered))}</span>{' '}
            confirmed or completed
          </p>

          {/* Desktop table */}
          {desktop ? (
            <div>
              <Table>
                <thead>
                  <tr>
                    <Th className="w-28">Time</Th>
                    <Th>Client</Th>
                    <Th>Service</Th>
                    {isAdmin && <Th>Professional</Th>}
                    <Th>Status</Th>
                    <Th className="text-right">Price</Th>
                  </tr>
                </thead>
                <tbody>
                  {byDay.map(([day, items]) => (
                    <Fragment key={day}>
                      <tr>
                        <td
                          colSpan={isAdmin ? 6 : 5}
                          className="border-b border-line bg-canvas/70 px-4 py-2 text-[13px] font-semibold text-ink"
                        >
                          {day === today ? 'Today · ' : ''}
                          {formatDay(day, { weekday: 'long', month: 'long' })}
                          <span className="ml-2 font-normal text-muted">{items.length}</span>
                        </td>
                      </tr>
                      {items.map((a) => (
                        <tr
                          key={a.id}
                          data-testid="appointment-row"
                          data-status={a.status}
                          onClick={() => setSelected(a)}
                          className="cursor-pointer bg-surface transition-colors hover:bg-subtle/60"
                        >
                          <Td className="tabular font-medium">
                            {formatTime(a.startsAt, tz)}
                            <span className="ml-1 font-normal text-faint">
                              {formatTime(a.endsAt, tz)}
                            </span>
                          </Td>
                          <Td>
                            <p className="font-semibold">{a.client.name}</p>
                            <p className="text-xs text-muted">{a.client.phone}</p>
                          </Td>
                          <Td>
                            <p>{a.service.name}</p>
                            <p className="text-xs text-muted">
                              {formatDuration(a.service.durationMinutes)} ·{' '}
                              <span className="font-mono">{a.code}</span>
                            </p>
                          </Td>
                          {isAdmin && (
                            <Td>
                              <span className="flex items-center gap-2">
                                <Avatar name={a.staff.name} color={a.staff.color} size="sm" />
                                {a.staff.name}
                              </span>
                            </Td>
                          )}
                          <Td>
                            <span className="flex items-center gap-1">
                              <StatusBadge status={a.status} />
                              {canComplete(a) && (
                                <IconButton
                                  label="Mark as completed"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    complete.mutate(a.id);
                                  }}
                                  disabled={complete.isPending}
                                  data-testid="quick-complete"
                                >
                                  <Check className="size-4" aria-hidden />
                                </IconButton>
                              )}
                            </span>
                          </Td>
                          <Td className="tabular text-right">{formatPrice(a.price)}</Td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="space-y-6">
              {byDay.map(([day, items]) => (
                <section key={day}>
                  <h3 className="mb-2 text-[13px] font-semibold">
                    {day === today ? 'Today · ' : ''}
                    {formatDay(day, { weekday: 'long', month: 'long' })}
                  </h3>
                  <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                    {items.map((a) => (
                      <li key={a.id} data-testid="appointment-row" data-status={a.status}>
                        <button
                          type="button"
                          onClick={() => setSelected(a)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left"
                        >
                          <span className="tabular w-12 shrink-0 pt-0.5 font-medium">
                            {formatTime(a.startsAt, tz)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{a.client.name}</span>
                            <span className="block truncate text-[13px] text-muted">
                              {a.service.name}
                              {isAdmin && ` · ${a.staff.name.split(' ')[0]}`}
                            </span>
                          </span>
                          <StatusBadge status={a.status} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
          {complete.isError && (
            <p role="alert" className="mt-3 text-sm font-medium text-danger">
              {complete.error.message}
            </p>
          )}
        </>
      )}

      <AppointmentDetail appointment={selected} timeZone={tz} onClose={() => setSelected(null)} />
    </div>
  );
}
