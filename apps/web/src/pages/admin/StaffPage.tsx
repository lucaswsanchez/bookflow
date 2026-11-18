import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { CalendarDays, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Skeleton,
} from '../../components/ui';
import { api } from '../../lib/api';
import { minutesToTime, slugify, timeToMinutes, WEEKDAYS } from '../../lib/format';
import type { Service, StaffMember, WorkingHours } from '../../lib/types';

// Monday-first order for display
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const PALETTE = ['#2f6b55', '#b07a4f', '#5b7c99', '#8a6f9e', '#a8553f', '#6b7d3a', '#3f6e78'];

const hoursFor = (hours: WorkingHours[] = [], weekday: number) =>
  hours.filter((h) => h.weekday === weekday).sort((a, b) => a.startMinute - b.startMinute);

const short = (minute: number) => {
  const t = minutesToTime(minute);
  return t.endsWith(':00') ? t.slice(0, 2) : t;
};

export default function StaffPage() {
  const [editing, setEditing] = useState<StaffMember | 'new' | null>(null);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);
  const queryClient = useQueryClient();
  const staff = useQuery({
    queryKey: ['staff', 'all'],
    queryFn: () => api<StaffMember[]>('/staff', { query: { includeInactive: 'true' } }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/staff/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff'] });
      setDeleting(null);
    },
  });

  return (
    <>
      <PageHeader
        title="Staff"
        description="Your team, the services each person offers and their weekly schedule."
        actions={
          <Button onClick={() => setEditing('new')} data-testid="new-staff">
            <Plus className="size-4" aria-hidden /> New staff member
          </Button>
        }
      />

      {staff.isError ? (
        <ErrorState message={staff.error.message} onRetry={() => staff.refetch()} />
      ) : staff.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : staff.data?.length === 0 ? (
        <EmptyState
          title="No staff yet"
          description="Add the people who take appointments."
          icon={<UserRound className="size-5" aria-hidden />}
        />
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {staff.data?.map((s) => (
            <li
              key={s.id}
              data-testid={`staff-card-${slugify(s.name)}`}
              className={clsx(
                'grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] lg:items-start',
                !s.active && 'opacity-70',
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} color={s.color} size="lg" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-bold">
                      <span className="truncate">{s.name}</span>
                      {!s.active && <Badge>Inactive</Badge>}
                    </p>
                    <p className="truncate text-[13px] text-muted">{s.title ?? 'Staff'}</p>
                    {s.user && (
                      <p className="truncate text-xs text-faint" title="Can log in">
                        {s.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.services?.length ? (
                    s.services.map((sv) => <Badge key={sv.id}>{sv.name}</Badge>)
                  ) : (
                    <span className="text-xs text-faint">No services assigned</span>
                  )}
                </div>
              </div>

              <div>
                <p className="eyebrow mb-2">Weekly hours</p>
                <ol className="grid grid-cols-7 gap-1" aria-label={`${s.name} weekly hours`}>
                  {WEEK_ORDER.map((d) => {
                    const ranges = hoursFor(s.workingHours, d);
                    return (
                      <li
                        key={d}
                        className={clsx(
                          'min-h-16 rounded-md px-1.5 py-2 text-center',
                          ranges.length ? 'bg-sage-50' : 'hatch',
                        )}
                      >
                        <p
                          className={clsx(
                            'text-[11px] font-bold',
                            ranges.length ? 'text-moss' : 'text-faint',
                          )}
                        >
                          {WEEKDAYS[d].slice(0, 3)}
                        </p>
                        {ranges.length ? (
                          ranges.map((h, i) => (
                            <p
                              key={i}
                              className="tabular mt-1 text-[11px] leading-tight text-ink-soft"
                            >
                              {short(h.startMinute)}–{short(h.endMinute)}
                            </p>
                          ))
                        ) : (
                          <p className="mt-1 text-[11px] text-faint">Off</p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="flex items-center gap-1 lg:flex-col lg:items-end">
                <Link
                  to={`/app/agenda?staff=${s.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong px-3 text-[13px] font-semibold text-ink hover:bg-subtle"
                  data-testid="staff-agenda-link"
                >
                  <CalendarDays className="size-4" aria-hidden /> Agenda
                </Link>
                <div className="flex">
                  <IconButton
                    label={`Edit ${s.name}`}
                    size="sm"
                    onClick={() => setEditing(s)}
                    data-testid="edit-staff"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </IconButton>
                  <IconButton
                    label={`Delete ${s.name}`}
                    size="sm"
                    onClick={() => {
                      remove.reset();
                      setDeleting(s);
                    }}
                    data-testid="delete-staff"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New staff member' : 'Edit staff member'}
        testId="staff-modal"
        size="lg"
      >
        {editing !== null && (
          <StaffForm staff={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.name ?? 'staff member'}?`}
        message="Staff with appointments are deactivated instead of deleted, so past bookings keep their professional."
        loading={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

interface Range {
  weekday: number;
  start: string;
  end: string;
}

function StaffForm({ staff, onDone }: { staff: StaffMember | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const services = useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => api<Service[]>('/services', { query: { includeInactive: 'true' } }),
  });
  const [name, setName] = useState(staff?.name ?? '');
  const [title, setTitle] = useState(staff?.title ?? '');
  const [color, setColor] = useState(staff?.color ?? PALETTE[0]);
  const [active, setActive] = useState(staff?.active ?? true);
  const [serviceIds, setServiceIds] = useState<string[]>(staff?.services?.map((s) => s.id) ?? []);
  const [ranges, setRanges] = useState<Range[]>(
    (staff?.workingHours ?? []).map((h) => ({
      weekday: h.weekday,
      start: minutesToTime(h.startMinute),
      end: minutesToTime(h.endMinute),
    })),
  );
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const workingHours = ranges.map((r) => ({
        weekday: r.weekday,
        startMinute: timeToMinutes(r.start),
        endMinute: timeToMinutes(r.end),
      }));
      const body = {
        name: name.trim(),
        title: title.trim() || undefined,
        color,
        active,
        serviceIds,
      };
      if (staff) {
        await api(`/staff/${staff.id}`, { method: 'PATCH', body });
        await api(`/staff/${staff.id}/working-hours`, { method: 'PUT', body: { workingHours } });
      } else {
        await api('/staff', { method: 'POST', body: { ...body, workingHours } });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff'] });
      onDone();
    },
    onError: (e) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Name is required');
    if (ranges.some((r) => !r.start || !r.end || r.end <= r.start))
      return setError('Each time range must end after it starts');
    setError(null);
    save.mutate();
  };

  const update = (i: number, patch: Partial<Range>) =>
    setRanges(ranges.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <form onSubmit={submit} noValidate className="space-y-6" data-testid="staff-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="staff-name">
          <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Title" htmlFor="staff-title" optional>
          <Input
            id="staff-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Barber"
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold">Agenda color</legend>
        <div className="flex flex-wrap items-center gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={clsx(
                'size-7 rounded-full ring-offset-2 transition',
                color === c ? 'ring-2 ring-ink' : 'hover:scale-110',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="ml-1 flex items-center gap-2 text-xs text-muted">
            Custom
            <input
              id="staff-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-9 cursor-pointer rounded border border-line-strong bg-surface"
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold">Services offered</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.data?.map((s) => (
            <Checkbox
              key={s.id}
              label={s.name}
              checked={serviceIds.includes(s.id)}
              onChange={(e) =>
                setServiceIds(
                  e.target.checked ? [...serviceIds, s.id] : serviceIds.filter((id) => id !== s.id),
                )
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-[13px] font-semibold">Weekly hours</legend>
        <p className="mb-3 text-xs text-muted">
          Add a second range for split shifts (e.g. 09–13 and 16–20).
        </p>
        <div className="divide-y divide-line rounded-md border border-line">
          {WEEK_ORDER.map((d) => {
            const dayRanges = ranges.map((r, i) => ({ r, i })).filter(({ r }) => r.weekday === d);
            return (
              <div
                key={d}
                className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm"
                data-testid={`hours-${WEEKDAYS[d].toLowerCase()}`}
              >
                <span
                  className={clsx(
                    'w-24 font-semibold',
                    dayRanges.length ? 'text-ink' : 'text-faint',
                  )}
                >
                  {WEEKDAYS[d]}
                </span>
                {dayRanges.length === 0 && <span className="text-xs text-faint">Day off</span>}
                {dayRanges.map(({ r, i }) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md bg-subtle py-1 pr-1 pl-2"
                  >
                    <input
                      type="time"
                      aria-label={`${WEEKDAYS[d]} start`}
                      value={r.start}
                      step={900}
                      onChange={(e) => update(i, { start: e.target.value })}
                      className="tabular rounded-sm bg-transparent text-[13px] focus:outline-none"
                    />
                    <span className="text-faint">–</span>
                    <input
                      type="time"
                      aria-label={`${WEEKDAYS[d]} end`}
                      value={r.end}
                      step={900}
                      onChange={(e) => update(i, { end: e.target.value })}
                      className="tabular rounded-sm bg-transparent text-[13px] focus:outline-none"
                    />
                    <IconButton
                      label="Remove range"
                      size="sm"
                      className="size-6!"
                      onClick={() => setRanges(ranges.filter((_, j) => j !== i))}
                    >
                      <X className="size-3.5" aria-hidden />
                    </IconButton>
                  </span>
                ))}
                <button
                  type="button"
                  className="ml-auto text-xs font-semibold text-forest hover:underline"
                  onClick={() =>
                    setRanges([
                      ...ranges,
                      dayRanges.length
                        ? { weekday: d, start: '16:00', end: '20:00' }
                        : { weekday: d, start: '09:00', end: '13:00' },
                    ])
                  }
                >
                  {dayRanges.length ? '+ Split shift' : '+ Add hours'}
                </button>
              </div>
            );
          })}
        </div>
      </fieldset>

      <Checkbox
        label="Active"
        description="Inactive staff can't be booked online."
        checked={active}
        onChange={(e) => setActive(e.target.checked)}
      />
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="-mx-5 -mb-5 flex justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-3">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending} data-testid="save-staff">
          Save staff member
        </Button>
      </div>
    </form>
  );
}
