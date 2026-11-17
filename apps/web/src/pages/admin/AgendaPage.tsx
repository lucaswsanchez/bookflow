import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Download, Phone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Modal,
  Spinner,
  StatusBadge,
} from '../../components/ui';
import { api, apiFetch } from '../../lib/api';
import {
  addDays,
  DEFAULT_TZ,
  formatDay,
  formatPrice,
  formatTime,
  minutesOfDay,
  minutesToTime,
  startOfWeek,
  toLocalDate,
} from '../../lib/format';
import { STATUS_LABELS } from '../../lib/status';
import type { Appointment, AppointmentStatus, StaffMember } from '../../lib/types';
import { PageHeader } from './AdminLayout';

type View = 'day' | 'week';
const DAY_START = 8 * 60;
const DAY_END = 21 * 60;
const PX_PER_MIN = 1.1;
const STATUSES: AppointmentStatus[] = ['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'];

export default function AgendaPage() {
  const { user } = useAuth();
  const tz = user?.business.timezone ?? DEFAULT_TZ;
  const isAdmin = user?.role === 'ADMIN';
  const today = toLocalDate(new Date(), tz);

  const [view, setView] = useState<View>('day');
  const [date, setDate] = useState(today);
  const [staffId, setStaffId] = useState('');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [exporting, setExporting] = useState(false);

  const from = view === 'day' ? date : startOfWeek(date);
  const to = view === 'day' ? date : addDays(from, 6);
  const days = useMemo(
    () => Array.from({ length: view === 'day' ? 1 : 7 }, (_, i) => addDays(from, i)),
    [from, view],
  );

  const staff = useQuery({
    queryKey: ['staff'],
    queryFn: () => api<StaffMember[]>('/staff'),
    enabled: isAdmin,
  });
  const appointments = useQuery({
    queryKey: ['appointments', from, to, staffId],
    queryFn: () => api<Appointment[]>('/appointments', { query: { from, to, staffId } }),
  });

  const queryClient = useQueryClient();
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api<Appointment>(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: (updated) => {
      setSelected(updated);
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const move = (dir: -1 | 1) => setDate(addDays(date, dir * (view === 'day' ? 1 : 7)));

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await apiFetch('/appointments/export', { query: { from, to, staffId } });
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookflow-appointments-${from}-to-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const visible = appointments.data ?? [];
  const columns =
    view === 'day' && isAdmin && !staffId && staff.data
      ? staff.data.map((s) => ({
          key: s.id,
          title: s.name,
          color: s.color,
          date,
          items: visible.filter((a) => a.staff.id === s.id),
        }))
      : days.map((d) => ({
          key: d,
          title: formatDay(d),
          color: undefined,
          date: d,
          items: visible.filter((a) => toLocalDate(new Date(a.startsAt), tz) === d),
        }));

  return (
    <>
      <PageHeader
        title="Agenda"
        description={isAdmin ? 'All appointments across your team.' : 'Your appointments.'}
        actions={
          <Button
            variant="secondary"
            onClick={() => void exportCsv()}
            loading={exporting}
            data-testid="export-csv"
          >
            <Download className="size-4" aria-hidden /> Export CSV
          </Button>
        }
      />

      <Card className="mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div
            className="inline-flex rounded-lg border border-slate-200 p-0.5"
            role="group"
            aria-label="View"
          >
            {(['day', 'week'] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                data-testid={`agenda-view-${v}`}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-sm font-medium capitalize',
                  view === v ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => move(-1)}
            aria-label="Previous"
            data-testid="agenda-prev"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDate(today)}
            data-testid="agenda-today"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => move(1)}
            aria-label="Next"
            data-testid="agenda-next"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
          <span className="ml-1 text-sm font-medium text-slate-900" data-testid="agenda-range">
            {view === 'day'
              ? formatDay(date, { month: 'long' })
              : `${formatDay(from, { weekday: undefined })} – ${formatDay(to, { weekday: undefined })}`}
          </span>
        </div>
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Staff
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              data-testid="agenda-staff-filter"
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">Everyone</option>
              {staff.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </Card>

      {appointments.isLoading ? (
        <Spinner label="Loading agenda…" />
      ) : appointments.isError ? (
        <ErrorState message={appointments.error.message} onRetry={() => appointments.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          testId="agenda-empty"
          title="No appointments"
          description="Nothing scheduled for this period."
        />
      ) : view === 'day' ? (
        <TimeGrid columns={columns} tz={tz} onSelect={setSelected} />
      ) : (
        <div className="grid gap-3 md:grid-cols-7" data-testid="agenda-week">
          {columns.map((col) => (
            <div key={col.key} className="min-w-0">
              <h3
                className={clsx(
                  'mb-2 text-sm font-semibold',
                  col.date === today ? 'text-brand-700' : 'text-slate-700',
                )}
              >
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.items.length === 0 && <li className="text-xs text-slate-400">—</li>}
                {col.items.map((a) => (
                  <li key={a.id}>
                    <AppointmentCard
                      appointment={a}
                      tz={tz}
                      onClick={() => setSelected(a)}
                      compact
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Appointment"
        testId="appointment-modal"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{selected.client.name}</p>
                <a
                  href={`tel:${selected.client.phone}`}
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700"
                >
                  <Phone className="size-3.5" aria-hidden /> {selected.client.phone}
                </a>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">When</dt>
              <dd className="font-medium">
                {formatDay(toLocalDate(new Date(selected.startsAt), tz))},{' '}
                {formatTime(selected.startsAt, tz)}–{formatTime(selected.endsAt, tz)}
              </dd>
              <dt className="text-slate-500">Service</dt>
              <dd className="font-medium">{selected.service.name}</dd>
              <dt className="text-slate-500">Professional</dt>
              <dd className="font-medium">{selected.staff.name}</dd>
              <dt className="text-slate-500">Price</dt>
              <dd className="font-medium">{formatPrice(selected.price)}</dd>
              <dt className="text-slate-500">Code</dt>
              <dd className="font-mono font-medium">{selected.code}</dd>
              {selected.notes && (
                <>
                  <dt className="text-slate-500">Notes</dt>
                  <dd>{selected.notes}</dd>
                </>
              )}
            </dl>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Change status</p>
              <div className="grid grid-cols-2 gap-2" data-testid="status-actions">
                {STATUSES.map((s) => (
                  <Button
                    key={s}
                    variant={selected.status === s ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={selected.status === s}
                    loading={updateStatus.isPending && updateStatus.variables?.status === s}
                    onClick={() => updateStatus.mutate({ id: selected.id, status: s })}
                    data-testid={`set-status-${s.toLowerCase()}`}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
              {updateStatus.isError && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {updateStatus.error.message}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

interface Column {
  key: string;
  title: string;
  color?: string;
  items: Appointment[];
}

function TimeGrid({
  columns,
  tz,
  onSelect,
}: {
  columns: Column[];
  tz: string;
  onSelect: (a: Appointment) => void;
}) {
  const hours: number[] = [];
  for (let m = DAY_START; m < DAY_END; m += 60) hours.push(m);
  const height = (DAY_END - DAY_START) * PX_PER_MIN;

  return (
    <Card className="overflow-x-auto">
      <div className="flex min-w-[640px]" data-testid="agenda-day">
        <div className="w-14 shrink-0 border-r border-slate-100 pt-10">
          <div className="relative" style={{ height }}>
            {hours.map((m) => (
              <span
                key={m}
                className="absolute right-2 -translate-y-1/2 text-xs text-slate-400"
                style={{ top: (m - DAY_START) * PX_PER_MIN }}
              >
                {minutesToTime(m)}
              </span>
            ))}
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.key} className="min-w-40 flex-1 border-r border-slate-100 last:border-r-0">
            <div className="flex h-10 items-center gap-2 border-b border-slate-100 px-3 text-sm font-medium text-slate-700">
              {col.color && (
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: col.color }}
                  aria-hidden
                />
              )}
              {col.title}
            </div>
            <div className="relative" style={{ height }}>
              {hours.map((m) => (
                <div
                  key={m}
                  className="absolute inset-x-0 border-t border-slate-100"
                  style={{ top: (m - DAY_START) * PX_PER_MIN }}
                  aria-hidden
                />
              ))}
              {col.items.map((a) => {
                const start = Math.max(minutesOfDay(a.startsAt, tz), DAY_START);
                const end = Math.min(minutesOfDay(a.endsAt, tz), DAY_END);
                return (
                  <div
                    key={a.id}
                    className="absolute inset-x-1"
                    style={{
                      top: (start - DAY_START) * PX_PER_MIN + 1,
                      height: Math.max((end - start) * PX_PER_MIN - 2, 22),
                    }}
                  >
                    <AppointmentCard appointment={a} tz={tz} onClick={() => onSelect(a)} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AppointmentCard({
  appointment: a,
  tz,
  onClick,
  compact,
}: {
  appointment: Appointment;
  tz: string;
  onClick: () => void;
  compact?: boolean;
}) {
  const cancelled = a.status === 'CANCELLED';
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="appointment-card"
      data-status={a.status}
      className={clsx(
        'h-full w-full overflow-hidden rounded-md border-l-4 bg-white px-2 py-1 text-left text-xs shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-400',
        cancelled && 'opacity-50 line-through',
        compact && 'py-1.5',
      )}
      style={{ borderLeftColor: a.staff.color }}
    >
      <span className="font-semibold text-slate-900">{formatTime(a.startsAt, tz)}</span>{' '}
      <span className="text-slate-700">{a.client.name}</span>
      <span className="block truncate text-slate-500">
        {a.service.name}
        {compact && ` · ${a.staff.name.split(' ')[0]}`}
      </span>
      {a.status !== 'CONFIRMED' && <span className="sr-only">({STATUS_LABELS[a.status]})</span>}
    </button>
  );
}
