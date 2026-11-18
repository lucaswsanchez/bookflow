import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Pencil, Phone, Plus, Search, Trash2, Users } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../../auth/useAuth';
import {
  Avatar,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Skeleton,
  Spinner,
  StatusBadge,
  Table,
  Td,
  Textarea,
  Th,
} from '../../components/ui';
import { api } from '../../lib/api';
import { DEFAULT_TZ, formatDay, formatPrice, formatTime, toLocalDate } from '../../lib/format';
import type { AppointmentStatus, Client } from '../../lib/types';

const schema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{6,20}$/, 'Enter a valid phone number'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
  notes: z.string().max(500, 'At most 500 characters').optional(),
});
type FormValues = z.infer<typeof schema>;

interface ClientDetail extends Client {
  createdAt: string;
  appointments: {
    id: string;
    code: string;
    startsAt: string;
    status: AppointmentStatus;
    price: number;
    service: { name: string };
    staff: { name: string };
  }[];
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search);
  const [editing, setEditing] = useState<Client | 'new' | null>(null);
  const [viewing, setViewing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);
  const queryClient = useQueryClient();

  const clients = useQuery({
    queryKey: ['clients', deferred],
    queryFn: () => api<Client[]>('/clients', { query: { search: deferred } }),
    placeholderData: (prev) => prev,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/clients/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDeleting(null);
    },
  });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Everyone who has booked with you. Online bookings add clients automatically."
        actions={
          <Button onClick={() => setEditing('new')} data-testid="new-client">
            <Plus className="size-4" aria-hidden /> New client
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search by name, phone or email"
            aria-label="Search clients"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="client-search"
          />
        </div>
        {clients.data && (
          <p className="text-[13px] text-muted">
            <span className="font-bold text-ink">{clients.data.length}</span>{' '}
            {clients.data.length === 1 ? 'client' : 'clients'}
          </p>
        )}
      </div>

      {clients.isError ? (
        <ErrorState message={clients.error.message} onRetry={() => clients.refetch()} />
      ) : clients.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : clients.data?.length === 0 ? (
        <EmptyState
          title="No clients found"
          icon={<Users className="size-5" aria-hidden />}
          description={
            search ? 'Try a different search.' : 'Clients appear here after their first booking.'
          }
        />
      ) : (
        <div data-testid="clients-table">
          <Table>
            <thead>
              <tr>
                <Th>Client</Th>
                <Th>Phone</Th>
                <Th className="hidden sm:table-cell">Email</Th>
                <Th className="text-right">Bookings</Th>
                <Th className="w-24">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {clients.data?.map((c) => {
                const bookings = c._count?.appointments ?? 0;
                return (
                  <tr
                    key={c.id}
                    data-testid="client-row"
                    onClick={() => setViewing(c)}
                    className="cursor-pointer transition-colors hover:bg-subtle/60"
                  >
                    <Td>
                      <span className="flex items-center gap-3">
                        <Avatar name={c.name} color="#a4b99c" size="sm" />
                        <span className="font-semibold">{c.name}</span>
                      </span>
                    </Td>
                    <Td className="tabular whitespace-nowrap text-ink-soft">{c.phone}</Td>
                    <Td className="hidden text-ink-soft sm:table-cell">{c.email ?? '—'}</Td>
                    <Td className="tabular text-right">{bookings}</Td>
                    <Td>
                      <div className="flex justify-end gap-0.5">
                        <IconButton
                          label={`Edit ${c.name}`}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(c);
                          }}
                          data-testid="edit-client"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </IconButton>
                        <IconButton
                          label={
                            bookings > 0
                              ? 'Clients with appointments cannot be deleted'
                              : `Delete ${c.name}`
                          }
                          size="sm"
                          disabled={bookings > 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            remove.reset();
                            setDeleting(c);
                          }}
                          data-testid="delete-client"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </IconButton>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New client' : 'Edit client'}
        testId="client-modal"
      >
        {editing !== null && (
          <ClientForm client={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
        )}
      </Modal>

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? 'Client'}
        testId="client-detail"
        size="lg"
      >
        {viewing && (
          <ClientProfile
            clientId={viewing.id}
            onEdit={() => {
              setEditing(viewing);
              setViewing(null);
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.name ?? 'client'}?`}
        message="This permanently removes the client. Only clients without appointments can be deleted."
        loading={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

function ClientProfile({ clientId, onEdit }: { clientId: string; onEdit: () => void }) {
  const { user } = useAuth();
  const tz = user?.business.timezone ?? DEFAULT_TZ;
  const client = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => api<ClientDetail>(`/clients/${clientId}`),
  });

  if (client.isLoading) return <Spinner />;
  if (client.isError) return <ErrorState message={client.error.message} />;
  const c = client.data!;
  const visits = c.appointments.filter((a) => a.status === 'COMPLETED');
  const now = Date.now();
  const next = [...c.appointments]
    .reverse()
    .find((a) => a.status === 'CONFIRMED' && new Date(a.startsAt).getTime() > now);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 text-sm">
          <a
            href={`tel:${c.phone}`}
            className="flex items-center gap-2 text-ink-soft hover:text-forest"
          >
            <Phone className="size-4 text-faint" aria-hidden /> {c.phone}
          </a>
          {c.email && (
            <a
              href={`mailto:${c.email}`}
              className="flex items-center gap-2 text-ink-soft hover:text-forest"
            >
              <Mail className="size-4 text-faint" aria-hidden /> {c.email}
            </a>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" aria-hidden /> Edit
        </Button>
      </div>

      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        {[
          ['Completed visits', visits.length],
          ['Spent', formatPrice(visits.reduce((s, a) => s + a.price, 0))],
          [
            'Next visit',
            next
              ? formatDay(toLocalDate(new Date(next.startsAt), tz), { weekday: undefined })
              : '—',
          ],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-surface px-3 py-3">
            <dt className="eyebrow">{label}</dt>
            <dd className="tabular mt-1 text-base font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      {c.notes && (
        <div className="rounded-md bg-sand-50 px-4 py-3 text-sm text-ink-soft">
          <p className="eyebrow mb-1 text-sand-700">Notes</p>
          {c.notes}
        </div>
      )}

      <div>
        <p className="eyebrow mb-2">
          History{c.appointments.length >= 20 && ' · last 20 appointments'}
        </p>
        {c.appointments.length === 0 ? (
          <p className="text-sm text-muted">No appointments yet.</p>
        ) : (
          <ul className="divide-y divide-line" data-testid="client-history">
            {c.appointments.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                <div className="w-28 shrink-0">
                  <p className="font-semibold">
                    {formatDay(toLocalDate(new Date(a.startsAt), tz), { weekday: undefined })}
                  </p>
                  <p className="tabular text-xs text-muted">{formatTime(a.startsAt, tz)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{a.service.name}</p>
                  <p className="truncate text-xs text-muted">{a.staff.name}</p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ClientForm({ client, onDone }: { client: Client | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name ?? '',
      phone: client?.phone ?? '',
      email: client?.email ?? '',
      notes: client?.notes ?? '',
    },
  });
  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const body = { ...v, email: v.email || undefined, notes: v.notes || undefined };
      return client
        ? api(`/clients/${client.id}`, { method: 'PATCH', body })
        : api('/clients', { method: 'POST', body });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      await queryClient.invalidateQueries({ queryKey: ['client'] });
      onDone();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => save.mutate(v))}
      noValidate
      className="space-y-5"
      data-testid="client-form"
    >
      <Field label="Name" htmlFor="client-name" error={errors.name?.message}>
        <Input id="client-name" invalid={!!errors.name} {...register('name')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" htmlFor="client-phone" error={errors.phone?.message}>
          <Input
            id="client-phone"
            type="tel"
            placeholder="+54 379 4123456"
            invalid={!!errors.phone}
            {...register('phone')}
          />
        </Field>
        <Field label="Email" htmlFor="client-email" optional error={errors.email?.message}>
          <Input id="client-email" type="email" invalid={!!errors.email} {...register('email')} />
        </Field>
      </div>
      <Field
        label="Notes"
        htmlFor="client-notes"
        optional
        error={errors.notes?.message}
        hint="Preferences, allergies, anything useful for the next visit."
      >
        <Textarea id="client-notes" rows={3} {...register('notes')} />
      </Field>
      {save.isError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {save.error.message}
        </p>
      )}
      <div className="-mx-5 -mb-5 flex justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-3">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending} data-testid="save-client">
          Save client
        </Button>
      </div>
    </form>
  );
}
