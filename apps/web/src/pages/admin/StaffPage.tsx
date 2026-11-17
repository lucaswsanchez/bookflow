import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Spinner,
} from '../../components/ui';
import { api } from '../../lib/api';
import { minutesToTime, slugify, timeToMinutes, WEEKDAYS } from '../../lib/format';
import type { Service, StaffMember, WorkingHours } from '../../lib/types';
import { PageHeader } from './AdminLayout';

// Monday-first order for display
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function summarizeHours(hours: WorkingHours[] = []) {
  return WEEK_ORDER.map((d) => ({
    weekday: d,
    ranges: hours
      .filter((h) => h.weekday === d)
      .sort((a, b) => a.startMinute - b.startMinute)
      .map((h) => `${minutesToTime(h.startMinute)}–${minutesToTime(h.endMinute)}`),
  }));
}

export default function StaffPage() {
  const [editing, setEditing] = useState<StaffMember | 'new' | null>(null);
  const queryClient = useQueryClient();
  const staff = useQuery({
    queryKey: ['staff', 'all'],
    queryFn: () => api<StaffMember[]>('/staff', { query: { includeInactive: 'true' } }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/staff/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
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
      {staff.isLoading && <Spinner />}
      {staff.isError && (
        <ErrorState message={staff.error.message} onRetry={() => staff.refetch()} />
      )}
      {staff.data?.length === 0 && <EmptyState title="No staff yet" />}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staff.data?.map((s) => (
          <Card key={s.id} className="flex flex-col p-5">
            <div data-testid={`staff-card-${slugify(s.name)}`} className="flex flex-1 flex-col">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-10 place-items-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: s.color }}
                    aria-hidden
                  >
                    {s.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      {s.title ?? 'Staff'}
                      {!s.active && ' · Inactive'}
                      {s.user && ` · ${s.user.email}`}
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(s)}
                    aria-label={`Edit ${s.name}`}
                    data-testid="edit-staff"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${s.name}`}
                    onClick={() =>
                      confirm(
                        `Delete ${s.name}? Staff with appointments will be deactivated instead.`,
                      ) && remove.mutate(s.id)
                    }
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-1">
                {s.services?.map((sv) => (
                  <span
                    key={sv.id}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {sv.name}
                  </span>
                ))}
              </div>
              <dl className="mt-auto grid grid-cols-[3rem_1fr] gap-y-1 text-xs">
                {summarizeHours(s.workingHours).map(({ weekday, ranges }) => (
                  <div key={weekday} className="contents">
                    <dt className="text-slate-500">{WEEKDAYS[weekday].slice(0, 3)}</dt>
                    <dd className={ranges.length ? 'text-slate-800' : 'text-slate-400'}>
                      {ranges.length ? ranges.join(', ') : 'Off'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Card>
        ))}
      </div>
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New staff member' : 'Edit staff member'}
        testId="staff-modal"
      >
        {editing !== null && (
          <StaffForm staff={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
        )}
      </Modal>
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
  const [color, setColor] = useState(staff?.color ?? '#4f46e5');
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

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="staff-form">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Name" htmlFor="staff-name">
          <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Color" htmlFor="staff-color">
          <input
            id="staff-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300"
          />
        </Field>
      </div>
      <Field label="Title" htmlFor="staff-title">
        <Input
          id="staff-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior Barber"
        />
      </Field>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Services offered</legend>
        <div className="grid grid-cols-2 gap-1">
          {services.data?.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="size-4 accent-brand-600"
                checked={serviceIds.includes(s.id)}
                onChange={(e) =>
                  setServiceIds(
                    e.target.checked
                      ? [...serviceIds, s.id]
                      : serviceIds.filter((id) => id !== s.id),
                  )
                }
              />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Weekly hours</legend>
        <div className="space-y-2">
          {WEEK_ORDER.map((d) => {
            const dayRanges = ranges.map((r, i) => ({ r, i })).filter(({ r }) => r.weekday === d);
            return (
              <div
                key={d}
                className="flex flex-wrap items-center gap-2 text-sm"
                data-testid={`hours-${WEEKDAYS[d].toLowerCase()}`}
              >
                <span className="w-10 text-slate-500">{WEEKDAYS[d].slice(0, 3)}</span>
                {dayRanges.length === 0 && <span className="text-xs text-slate-400">Off</span>}
                {dayRanges.map(({ r, i }) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-1.5 py-1"
                  >
                    <input
                      type="time"
                      aria-label={`${WEEKDAYS[d]} start`}
                      value={r.start}
                      step={900}
                      onChange={(e) =>
                        setRanges(
                          ranges.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)),
                        )
                      }
                      className="rounded border border-slate-300 px-1 text-xs"
                    />
                    –
                    <input
                      type="time"
                      aria-label={`${WEEKDAYS[d]} end`}
                      value={r.end}
                      step={900}
                      onChange={(e) =>
                        setRanges(
                          ranges.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)),
                        )
                      }
                      className="rounded border border-slate-300 px-1 text-xs"
                    />
                    <button
                      type="button"
                      aria-label="Remove range"
                      onClick={() => setRanges(ranges.filter((_, j) => j !== i))}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  className="text-xs font-medium text-brand-700 hover:underline"
                  onClick={() =>
                    setRanges([...ranges, { weekday: d, start: '09:00', end: '13:00' }])
                  }
                >
                  + Add
                </button>
              </div>
            );
          })}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="size-4 accent-brand-600"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />{' '}
        Active (bookable)
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending} data-testid="save-staff">
          Save
        </Button>
      </div>
    </form>
  );
}
