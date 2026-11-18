import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import type { Client } from '../../lib/types';
import { PageHeader } from '../../components/ui';

const schema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{6,20}$/, 'Enter a valid phone number'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
  notes: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search);
  const [editing, setEditing] = useState<Client | 'new' | null>(null);
  const queryClient = useQueryClient();

  const clients = useQuery({
    queryKey: ['clients', deferred],
    queryFn: () => api<Client[]>('/clients', { query: { search: deferred } }),
    placeholderData: (prev) => prev,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/clients/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
    onError: (e) => alert(e.message),
  });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Everyone who has booked with you. Clients are added automatically from online bookings."
        actions={
          <Button onClick={() => setEditing('new')} data-testid="new-client">
            <Plus className="size-4" aria-hidden /> New client
          </Button>
        }
      />
      <div className="relative mb-4 max-w-sm">
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
      {clients.isLoading && <Spinner />}
      {clients.isError && (
        <ErrorState message={clients.error.message} onRetry={() => clients.refetch()} />
      )}
      {clients.data && clients.data.length === 0 && (
        <EmptyState
          title="No clients found"
          description={
            search ? 'Try a different search.' : 'Clients appear here after their first booking.'
          }
        />
      )}
      {clients.data && clients.data.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="clients-table">
            <thead className="border-b border-line text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Email</th>
                <th className="px-4 py-3 font-medium">Bookings</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {clients.data.map((c) => (
                <tr key={c.id} data-testid="client-row">
                  <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{c.phone}</td>
                  <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-soft">{c._count?.appointments ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(c)}
                        aria-label={`Edit ${c.name}`}
                        data-testid="edit-client"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${c.name}`}
                        data-testid="delete-client"
                        disabled={(c._count?.appointments ?? 0) > 0}
                        title={
                          (c._count?.appointments ?? 0) > 0
                            ? 'Clients with appointments cannot be deleted'
                            : undefined
                        }
                        onClick={() => confirm(`Delete ${c.name}?`) && remove.mutate(c.id)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
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
    </>
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
      onDone();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => save.mutate(v))}
      noValidate
      className="space-y-4"
      data-testid="client-form"
    >
      <Field label="Name" htmlFor="client-name" error={errors.name?.message}>
        <Input id="client-name" invalid={!!errors.name} {...register('name')} />
      </Field>
      <Field label="Phone" htmlFor="client-phone" error={errors.phone?.message}>
        <Input id="client-phone" type="tel" invalid={!!errors.phone} {...register('phone')} />
      </Field>
      <Field label="Email" htmlFor="client-email" error={errors.email?.message}>
        <Input id="client-email" type="email" invalid={!!errors.email} {...register('email')} />
      </Field>
      <Field label="Notes" htmlFor="client-notes">
        <Input id="client-notes" {...register('notes')} />
      </Field>
      {save.isError && (
        <p role="alert" className="text-sm text-danger">
          {save.error.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending} data-testid="save-client">
          Save
        </Button>
      </div>
    </form>
  );
}
