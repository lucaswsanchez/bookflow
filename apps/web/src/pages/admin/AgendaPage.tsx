import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Check, ChevronLeft, ChevronRight, Download, UserX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { AppointmentDetail } from '../../components/AppointmentDetail';
import {
  Avatar,
  Button,
  ErrorState,
  IconButton,
  PageHeader,
  Segmented,
  Select,
  Skeleton,
} from '../../components/ui';
import { api } from '../../lib/api';
import { downloadAppointmentsCsv } from '../../lib/download';
import {
  addDays,
  DEFAULT_TZ,
  formatDay,
  formatTime,
  minutesOfDay,
  minutesToTime,
  slugify,
  startOfWeek,
  toLocalDate,
} from '../../lib/format';
import { STATUS_LABELS, STATUS_TONES } from '../../lib/status';
import type { Appointment, AppointmentStatus, StaffMember } from '../../lib/types';
import { layoutLanes, type Positioned } from './agenda-layout';

type View = 'day' | 'week';
const PX_PER_MIN = 1.4;
const LEGEND: AppointmentStatus[] = ['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'];

interface Column {
  key: string;
  date: string;
  staff: StaffMember[];
  items: Appointment[];
  header: React.ReactNode;
}

export default function AgendaPage() {
  const { user } = useAuth();
  const tz = user?.business.timezone ?? DEFAULT_TZ;
  const isAdmin = user?.role === 'ADMIN';
  const today = toLocalDate(new Date(), tz);

  const [view, setView] = useState<View>('day');
  const [date, setDate] = useState(today);
  const [params] = useSearchParams();
  const [staffId, setStaffId] = useState(() => (isAdmin && params.get('staff')) || '');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [exporting, setExporting] = useState(false);

  const from = view === 'day' ? date : startOfWeek(date);
  const to = view === 'day' ? date : addDays(from, 6);
  const days = useMemo(
    () => Array.from({ length: view === 'day' ? 1 : 7 }, (_, i) => addDays(from, i)),
    [from, view],
  );

  const staff = useQuery({ queryKey: ['staff'], queryFn: () => api<StaffMember[]>('/staff') });
  const appointments = useQuery({
    queryKey: ['appointments', from, to, staffId],
    queryFn: () => api<Appointment[]>('/appointments', { query: { from, to, staffId } }),
  });

  // Whose working hours are on screen: everyone, the filtered person, or the STAFF user.
  const people = useMemo(() => {
    const all = staff.data ?? [];
    if (!isAdmin) return all.filter((s) => s.id === user?.staffId);
    return staffId ? all.filter((s) => s.id === staffId) : all;
  }, [staff.data, isAdmin, staffId, user?.staffId]);

  const visible = useMemo(() => appointments.data ?? [], [appointments.data]);

  const columns: Column[] = useMemo(() => {
    if (view === 'day' && people.length > 1) {
      return people.map((s) => {
        const items = visible.filter((a) => a.staff.id === s.id);
        return {
          key: s.id,
          date,
          staff: [s],
          items,
          header: (
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={s.name} color={s.color} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">{s.name}</p>
                <p className="text-[11px] text-muted">
                  {countActive(items)} appointment{countActive(items) === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          ),
        };
      });
    }
    return days.map((d) => {
      const items = visible.filter((a) => toLocalDate(new Date(a.startsAt), tz) === d);
      return {
        key: d,
        date: d,
        staff: people,
        items,
        header: (
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'grid size-7 place-items-center rounded-full text-[13px] font-semibold tabular',
                d === today ? 'bg-accent-strong text-white' : 'text-ink',
              )}
            >
              {Number(d.slice(8))}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-[12px] font-semibold text-ink-soft">
                {formatDay(d, { month: undefined, day: undefined })}
              </p>
              <p className="text-[11px] text-muted">{countActive(items)} appts</p>
            </div>
          </div>
        ),
      };
    });
  }, [view, people, visible, date, days, tz, today]);

  // On phones the day view shows one professional at a time instead of cramped columns.
  const desktop = useMediaQuery('(min-width: 768px)');
  const [phoneStaff, setPhoneStaff] = useState<string | null>(null);
  const phoneColumns =
    !desktop && view === 'day' && columns.length > 1
      ? [
          columns.find((c) => c.key === phoneStaff) ??
            [...columns].sort((x, y) => countActive(y.items) - countActive(x.items))[0] ??
            columns[0],
        ]
      : null;

  const [dayStart, dayEnd] = useMemo(() => hourRange(people, visible, tz), [people, visible, tz]);

  const move = (dir: -1 | 1) => setDate(addDays(date, dir * (view === 'day' ? 1 : 7)));

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadAppointmentsCsv({ from, to, staffId });
    } finally {
      setExporting(false);
    }
  };

  const active = countActive(visible);

  return (
    <>
      <PageHeader
        title="Agenda"
        description={isAdmin ? 'Every appointment across your team.' : 'Your appointments.'}
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

      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-soft">
        {/* Toolbar */}
        <div className="flex flex-col gap-2.5 border-b border-line px-3 py-2.5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDate(today)}
              data-testid="agenda-today"
            >
              Today
            </Button>
            <div className="flex shrink-0 items-center">
              <IconButton
                label="Previous"
                size="sm"
                onClick={() => move(-1)}
                data-testid="agenda-prev"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </IconButton>
              <IconButton label="Next" size="sm" onClick={() => move(1)} data-testid="agenda-next">
                <ChevronRight className="size-4" aria-hidden />
              </IconButton>
            </div>
            <h2
              className="ml-1 truncate text-[15px] font-semibold tracking-[-0.01em]"
              data-testid="agenda-range"
            >
              {view === 'day'
                ? formatDay(date, desktop ? { weekday: 'long', month: 'long' } : {})
                : `${formatDay(from, { weekday: undefined })} – ${formatDay(to, { weekday: undefined })}`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0">
              <span className="sr-only">Go to date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                data-testid="agenda-date-input"
                className="mono h-8 rounded-md border border-line-strong bg-surface px-2 text-[12px] text-ink-soft shadow-soft hover:border-faint focus:border-accent focus:ring-3 focus:ring-accent-100 focus:outline-none"
              />
            </label>
            {isAdmin && !(phoneColumns && view === 'day') && (
              <Select
                aria-label="Filter by professional"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                data-testid="agenda-staff-filter"
                className="h-8! min-w-32 flex-1 text-[13px] xl:w-48 xl:flex-none"
              >
                <option value="">All staff</option>
                {staff.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
            <div className="ml-auto shrink-0">
              <Segmented
                label="View"
                value={view}
                onChange={setView}
                options={[
                  { value: 'day', label: 'Day', testId: 'agenda-view-day' },
                  { value: 'week', label: 'Week', testId: 'agenda-view-week' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Summary + legend */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 border-b border-line bg-canvas px-3 py-2 text-[12px]">
          <p className="text-muted">
            {appointments.isLoading ? (
              'Loading…'
            ) : active === 0 ? (
              <span data-testid="agenda-empty">No appointments in this period.</span>
            ) : (
              <>
                <span className="tabular font-medium text-ink">{active}</span> appointment
                {active === 1 ? '' : 's'}
                {visible.length > active && ` · ${visible.length - active} cancelled`}
              </>
            )}
          </p>
          <ul
            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted"
            aria-label="Legend"
          >
            {LEGEND.map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <span className={clsx('size-1.5 rounded-full', STATUS_TONES[s].dot)} aria-hidden />
                {STATUS_LABELS[s]}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span className="hatch size-2.5 rounded-sm border border-line-strong" aria-hidden />
              Off hours
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-px bg-signal" aria-hidden />
              Now
            </li>
            {view === 'week' && people.length > 1 && (
              <li className="flex items-center gap-1.5">
                <span className="flex -space-x-0.5" aria-hidden>
                  {people.slice(0, 3).map((m) => (
                    <span
                      key={m.id}
                      className="size-1.5 rounded-full ring-1 ring-canvas"
                      style={{ backgroundColor: m.color }}
                    />
                  ))}
                </span>
                Professional
              </li>
            )}
          </ul>
        </div>

        {appointments.isError ? (
          <ErrorState message={appointments.error.message} onRetry={() => appointments.refetch()} />
        ) : appointments.isLoading || staff.isLoading ? (
          <Skeleton className="h-[560px] w-full rounded-none" />
        ) : (
          <>
            {phoneColumns && (
              <div
                className="flex gap-2 overflow-x-auto border-b border-line px-3 py-2 [scrollbar-width:none]"
                role="tablist"
                aria-label="Professional"
              >
                {columns.map((c) => {
                  const member = people.find((p) => p.id === c.key);
                  const selectedTab = c.key === phoneColumns[0].key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      role="tab"
                      aria-selected={selectedTab}
                      onClick={() => setPhoneStaff(c.key)}
                      data-testid={`agenda-staff-tab-${slugify(member?.name ?? c.key)}`}
                      className={clsx(
                        'flex shrink-0 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-[13px] font-semibold transition-colors',
                        selectedTab
                          ? 'border-accent bg-accent-strong text-white'
                          : 'border-line-strong bg-surface text-ink-soft',
                      )}
                    >
                      {member && <Avatar name={member.name} color={member.color} size="sm" />}
                      {member?.name.split(' ')[0]}
                      <span className={selectedTab ? 'text-accent-50' : 'text-muted'}>
                        {countActive(c.items)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <TimeGrid
              columns={phoneColumns ?? columns}
              tz={tz}
              today={today}
              dayStart={dayStart}
              dayEnd={dayEnd}
              showStaff={people.length > 1 && (view === 'week' || columns.length === 1)}
              dense={view === 'week'}
              testId={view === 'day' ? 'agenda-day' : 'agenda-week'}
              onSelect={setSelected}
            />
          </>
        )}
      </div>

      <AppointmentDetail appointment={selected} timeZone={tz} onClose={() => setSelected(null)} />
    </>
  );
}

const countActive = (items: Appointment[]) => items.filter((a) => a.status !== 'CANCELLED').length;

/** Visible hour range: from the earliest working hour to the latest, never cutting appointments. */
function hourRange(people: StaffMember[], items: Appointment[], tz: string): [number, number] {
  const starts = people.flatMap((p) => p.workingHours?.map((h) => h.startMinute) ?? []);
  const ends = people.flatMap((p) => p.workingHours?.map((h) => h.endMinute) ?? []);
  for (const a of items) {
    starts.push(minutesOfDay(a.startsAt, tz));
    ends.push(minutesOfDay(a.endsAt, tz) || 24 * 60);
  }
  if (starts.length === 0) return [8 * 60, 20 * 60];
  const start = Math.floor(Math.min(...starts) / 60) * 60;
  const end = Math.ceil(Math.max(...ends) / 60) * 60;
  return [Math.max(0, start), Math.min(24 * 60, end)];
}

function useNowMinutes(tz: string) {
  const [now, setNow] = useState(() => minutesOfDay(new Date().toISOString(), tz));
  useEffect(() => {
    const id = setInterval(() => setNow(minutesOfDay(new Date().toISOString(), tz)), 60_000);
    return () => clearInterval(id);
  }, [tz]);
  return now;
}

function TimeGrid({
  columns,
  tz,
  today,
  dayStart,
  dayEnd,
  showStaff,
  dense,
  testId,
  onSelect,
}: {
  columns: Column[];
  tz: string;
  today: string;
  dayStart: number;
  dayEnd: number;
  showStaff: boolean;
  dense?: boolean;
  testId: string;
  onSelect: (a: Appointment) => void;
}) {
  const now = useNowMinutes(tz);
  const hours: number[] = [];
  for (let m = dayStart; m < dayEnd; m += 60) hours.push(m);
  const height = (dayEnd - dayStart) * PX_PER_MIN;
  const y = (minute: number) => (minute - dayStart) * PX_PER_MIN;
  const minColumn = columns.length > 3 ? 'min-w-[120px]' : 'min-w-[200px]';

  return (
    <div className="overflow-x-auto bg-surface" data-testid={testId}>
      <div className="flex min-w-fit">
        {/* Time gutter */}
        <div className="sticky left-0 z-20 w-14 shrink-0 border-r border-line bg-surface">
          <div className="h-14 border-b border-line" />
          <div className="relative" style={{ height }}>
            {hours.map((m) => (
              <span
                key={m}
                className="mono absolute right-2 -translate-y-1/2 bg-surface px-0.5 text-[10.5px] text-muted first:translate-y-0.5"
                style={{ top: y(m) }}
              >
                {minutesToTime(m)}
              </span>
            ))}
          </div>
        </div>

        {columns.map((col) => {
          const weekday = new Date(`${col.date}T12:00:00Z`).getUTCDay();
          const working = col.staff.flatMap(
            (s) => s.workingHours?.filter((h) => h.weekday === weekday) ?? [],
          );
          const lanes = layoutLanes(
            col.items.map((a) => ({
              item: a,
              start: Math.max(minutesOfDay(a.startsAt, tz), dayStart),
              end: Math.min(minutesOfDay(a.endsAt, tz) || 24 * 60, dayEnd),
            })),
          );
          return (
            <div
              key={col.key}
              className={clsx('flex-1 border-r border-line last:border-r-0', minColumn)}
            >
              <div
                className={clsx(
                  'sticky top-0 z-10 flex h-14 items-center border-b border-line px-3',
                  col.date === today && columns.some((c) => c.date !== col.date)
                    ? 'bg-accent-50'
                    : 'bg-surface',
                )}
              >
                {col.header}
              </div>
              <div className="hatch relative" style={{ height }}>
                {/* Working hours: plain background over the hatched "off hours" pattern */}
                {working.map((h, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0 bg-surface"
                    style={{
                      top: y(Math.max(h.startMinute, dayStart)),
                      height:
                        (Math.min(h.endMinute, dayEnd) - Math.max(h.startMinute, dayStart)) *
                        PX_PER_MIN,
                    }}
                    aria-hidden
                  />
                ))}
                {hours.map((m) => (
                  <div key={m} aria-hidden>
                    <div
                      className="absolute inset-x-0 border-t border-line"
                      style={{ top: y(m) }}
                    />
                    <div
                      className="absolute inset-x-0 border-t border-dashed border-line/70"
                      style={{ top: y(m + 30) }}
                    />
                  </div>
                ))}

                {lanes.map((p) => (
                  <Block
                    key={p.item.id}
                    p={p}
                    tz={tz}
                    top={y(p.start)}
                    height={(p.end - p.start) * PX_PER_MIN}
                    showStaff={showStaff}
                    dense={dense}
                    onClick={() => onSelect(p.item)}
                  />
                ))}

                {col.date === today && now >= dayStart && now <= dayEnd && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                    style={{ top: y(now) }}
                    data-testid="now-line"
                    aria-hidden
                  >
                    <span className="-ml-1 size-2 rounded-full bg-signal ring-2 ring-surface" />
                    <span className="h-0.5 flex-1 bg-signal" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Block({
  p,
  tz,
  top,
  height,
  showStaff,
  dense,
  onClick,
}: {
  p: Positioned<Appointment>;
  tz: string;
  top: number;
  height: number;
  showStaff: boolean;
  dense?: boolean;
  onClick: () => void;
}) {
  const a = p.item;
  const short = height < 40;
  const width = 100 / p.lanes;
  // Side-by-side blocks in the week view are too narrow for names: show the start time only.
  const compact = dense && p.lanes > 1;
  // A non-colour cue for finished appointments (cancelled ones are struck through).
  const mark =
    a.status === 'COMPLETED' ? (
      <Check className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
    ) : a.status === 'NO_SHOW' ? (
      <UserX className="size-3 shrink-0" aria-hidden />
    ) : null;
  const dot = showStaff && (
    <span
      className="size-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: a.staff.color }}
      aria-hidden
    />
  );
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="appointment-card"
      data-status={a.status}
      title={`${formatTime(a.startsAt, tz)} ${a.client.name} · ${a.service.name} · ${a.staff.name} (${STATUS_LABELS[a.status]})`}
      className={clsx(
        'absolute overflow-hidden rounded-[5px] border-l-[3px] text-left text-[12px] leading-tight transition-[filter,box-shadow] hover:z-10 hover:shadow-pop hover:brightness-[0.98] focus-visible:z-10',
        STATUS_TONES[a.status].block,
        compact ? 'px-1 py-1 text-[11px]' : 'px-2',
        !compact && (short ? 'flex items-center gap-1.5 py-0' : 'py-1.5'),
      )}
      style={{
        top: top + 1,
        height: Math.max(height - 2, 20),
        left: `calc(${p.lane * width}% + 3px)`,
        width: `calc(${width}% - 6px)`,
      }}
    >
      {compact ? (
        <span className="block">
          <span className="mono block font-medium tracking-[-0.04em]">
            {formatTime(a.startsAt, tz)}
          </span>
          {height >= 44 && <span className="mt-0.5 block opacity-80">{mark}</span>}
          <span className="sr-only">{a.client.name}</span>
        </span>
      ) : (
        <>
          <span className="mono flex shrink-0 items-center gap-1 font-medium">
            {formatTime(a.startsAt, tz)}
            {mark}
          </span>
          <span className={clsx('truncate font-medium', !short && 'block')}>{a.client.name}</span>
          {!short && (
            <span className="mt-0.5 flex items-center gap-1 truncate font-normal opacity-80">
              {dot}
              <span className="truncate">{a.service.name}</span>
            </span>
          )}
        </>
      )}
      <span className="sr-only">({STATUS_LABELS[a.status]})</span>
    </button>
  );
}
