import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Ban, CalendarCheck2, CheckCircle2, Mail, Phone, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatDay, formatDuration, formatPrice, formatTime, toLocalDate } from '../lib/format';
import { STATUS_LABELS } from '../lib/status';
import type { Appointment, AppointmentStatus } from '../lib/types';
import { Avatar, Modal, StatusBadge } from './ui';

const ACTIONS: { status: AppointmentStatus; icon: typeof CheckCircle2; hint: string }[] = [
  { status: 'COMPLETED', icon: CheckCircle2, hint: 'The client attended' },
  { status: 'NO_SHOW', icon: UserX, hint: "The client didn't show up" },
  { status: 'CANCELLED', icon: Ban, hint: 'Frees the time slot' },
  { status: 'CONFIRMED', icon: CalendarCheck2, hint: 'Back to confirmed' },
];

/**
 * Appointment detail with status actions. Shared by the agenda and the appointments list.
 * The API decides who can change what (STAFF only reach their own appointments).
 */
export function AppointmentDetail({
  appointment,
  timeZone,
  onClose,
}: {
  appointment: Appointment | null;
  timeZone: string;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(appointment);
  useEffect(() => setCurrent(appointment), [appointment]);

  const queryClient = useQueryClient();
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api<Appointment>(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: (updated) => {
      setCurrent(updated);
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['client'] });
    },
  });

  const a = current;
  return (
    <Modal
      open={!!appointment}
      onClose={() => {
        updateStatus.reset();
        onClose();
      }}
      title="Appointment"
      description={a ? <span className="font-mono">{a.code}</span> : undefined}
      testId="appointment-modal"
    >
      {a && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{a.client.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                <a
                  href={`tel:${a.client.phone}`}
                  className="inline-flex items-center gap-1.5 hover:text-accent-ink"
                >
                  <Phone className="size-3.5" aria-hidden /> {a.client.phone}
                </a>
                {a.client.email && (
                  <a
                    href={`mailto:${a.client.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-accent-ink"
                  >
                    <Mail className="size-3.5" aria-hidden /> {a.client.email}
                  </a>
                )}
              </div>
            </div>
            <StatusBadge status={a.status} />
          </div>

          <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 border-y border-line py-4 text-sm">
            <dt className="text-muted">When</dt>
            <dd className="font-semibold">
              {formatDay(toLocalDate(new Date(a.startsAt), timeZone), { month: 'long' })}
              <span className="tabular ml-2 font-normal text-ink-soft">
                {formatTime(a.startsAt, timeZone)} – {formatTime(a.endsAt, timeZone)}
              </span>
            </dd>
            <dt className="text-muted">Service</dt>
            <dd>
              <span className="font-semibold">{a.service.name}</span>
              <span className="ml-2 text-ink-soft">
                {formatDuration(a.service.durationMinutes)}
              </span>
            </dd>
            <dt className="text-muted">Professional</dt>
            <dd className="flex items-center gap-2 font-semibold">
              <Avatar name={a.staff.name} color={a.staff.color} size="sm" />
              {a.staff.name}
            </dd>
            <dt className="text-muted">Price</dt>
            <dd className="tabular font-semibold">{formatPrice(a.price)}</dd>
            {a.notes && (
              <>
                <dt className="text-muted">Notes</dt>
                <dd className="text-ink-soft">{a.notes}</dd>
              </>
            )}
          </dl>

          <div>
            <p className="eyebrow mb-2.5">Update status</p>
            <div className="grid gap-2 sm:grid-cols-2" data-testid="status-actions">
              {ACTIONS.map(({ status, icon: Icon, hint }) => {
                const active = a.status === status;
                const pending = updateStatus.isPending && updateStatus.variables?.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={active || updateStatus.isPending}
                    aria-pressed={active}
                    onClick={() => updateStatus.mutate({ id: a.id, status })}
                    data-testid={`set-status-${status.toLowerCase()}`}
                    className={clsx(
                      'flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed',
                      active
                        ? 'border-accent bg-accent-50'
                        : 'border-line hover:border-line-strong hover:bg-subtle disabled:opacity-60',
                    )}
                  >
                    <Icon
                      className={clsx(
                        'size-4 shrink-0',
                        active ? 'text-accent-ink' : 'text-muted',
                        pending && 'animate-pulse',
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ink">
                        {STATUS_LABELS[status]}
                        {active && <span className="ml-1.5 font-normal text-muted">· current</span>}
                      </span>
                      <span className="block truncate text-xs text-muted">{hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {updateStatus.isError && (
              <p role="alert" className="mt-3 text-sm font-medium text-danger">
                {updateStatus.error.message}
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
