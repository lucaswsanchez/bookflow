import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Pencil, Plus, Scissors, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AvatarStack,
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
  Table,
  Td,
  Textarea,
  Th,
} from '../../components/ui';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { api } from '../../lib/api';
import { formatDuration, formatPrice, slugify } from '../../lib/format';
import type { Service, StaffMember } from '../../lib/types';

const schema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  description: z.string().max(300, 'At most 300 characters').optional(),
  durationMinutes: z.coerce.number().int().min(5, 'At least 5 minutes').max(480, 'At most 8 hours'),
  price: z.coerce.number().int().min(0, 'Price cannot be negative'),
  active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Service | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const services = useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => api<Service[]>('/services', { query: { includeInactive: 'true' } }),
  });
  const staff = useQuery({ queryKey: ['staff'], queryFn: () => api<StaffMember[]>('/staff') });

  const remove = useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/services/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['services'] });
      setDeleting(null);
    },
  });

  const offeredBy = (serviceId: string) =>
    staff.data?.filter((s) => s.services?.some((sv) => sv.id === serviceId)) ?? [];
  const activeCount = services.data?.filter((s) => s.active).length ?? 0;
  const desktop = useMediaQuery('(min-width: 768px)');

  const actions = (s: Service) => (
    <div className="flex justify-end gap-0.5">
      <IconButton
        label={`Edit ${s.name}`}
        size="sm"
        onClick={() => setEditing(s)}
        data-testid="edit-service"
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
        data-testid="delete-service"
      >
        <Trash2 className="size-4" aria-hidden />
      </IconButton>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Services"
        description="What clients can book online, how long it takes and what it costs."
        actions={
          <Button onClick={() => setEditing('new')} data-testid="new-service">
            <Plus className="size-4" aria-hidden /> New service
          </Button>
        }
      />

      {services.isError ? (
        <ErrorState message={services.error.message} onRetry={() => services.refetch()} />
      ) : services.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : services.data?.length === 0 ? (
        <EmptyState
          title="No services yet"
          description="Create your first service so clients can book it."
          icon={<Scissors className="size-5" aria-hidden />}
          action={
            <Button size="sm" onClick={() => setEditing('new')}>
              New service
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-[13px] text-muted">
            <span className="font-semibold text-ink">{activeCount}</span> of {services.data?.length}{' '}
            services bookable online
          </p>
          {desktop ? (
            <div data-testid="services-table">
              <Table>
                <thead>
                  <tr>
                    <Th>Service</Th>
                    <Th>Duration</Th>
                    <Th className="text-right">Price</Th>
                    <Th>Offered by</Th>
                    <Th>Availability</Th>
                    <Th className="w-24">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {services.data?.map((s) => {
                    const people = offeredBy(s.id);
                    return (
                      <tr
                        key={s.id}
                        data-testid={`service-row-${slugify(s.name)}`}
                        className={s.active ? undefined : 'text-muted'}
                      >
                        <Td className="max-w-sm">
                          <p className="font-semibold text-ink">{s.name}</p>
                          {s.description && (
                            <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">
                              {s.description}
                            </p>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-ink-soft">
                            <Clock className="size-3.5 text-faint" aria-hidden />
                            {formatDuration(s.durationMinutes)}
                          </span>
                        </Td>
                        <Td className="tabular text-right font-medium whitespace-nowrap text-ink">
                          {formatPrice(s.price)}
                        </Td>
                        <Td>
                          {people.length === 0 ? (
                            <span className="text-[13px] text-faint">Nobody yet</span>
                          ) : (
                            <AvatarStack people={people} />
                          )}
                        </Td>
                        <Td>
                          {s.active ? <Badge tone="accent">Bookable</Badge> : <Badge>Hidden</Badge>}
                        </Td>
                        <Td>{actions(s)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <ul
              className="divide-y divide-line rounded-lg border border-line bg-surface"
              data-testid="services-table"
            >
              {services.data?.map((s) => {
                const people = offeredBy(s.id);
                return (
                  <li
                    key={s.id}
                    data-testid={`service-row-${slugify(s.name)}`}
                    className={s.active ? 'p-4' : 'p-4 opacity-70'}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{s.name}</p>
                        {s.description && (
                          <p className="mt-0.5 text-[13px] text-muted">{s.description}</p>
                        )}
                      </div>
                      <p className="tabular shrink-0 font-medium">{formatPrice(s.price)}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[13px] text-ink-soft">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5 text-faint" aria-hidden />
                        {formatDuration(s.durationMinutes)}
                      </span>
                      {people.length > 0 && <AvatarStack people={people} />}
                      {s.active ? <Badge tone="accent">Bookable</Badge> : <Badge>Hidden</Badge>}
                      <span className="ml-auto">{actions(s)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New service' : 'Edit service'}
        description="Duration defines which time slots clients can book."
        testId="service-modal"
      >
        {editing !== null && (
          <ServiceForm
            service={editing === 'new' ? null : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.name ?? 'service'}?`}
        message="Services that already have appointments are hidden from online booking instead of being deleted, so your history stays intact."
        loading={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

function ServiceForm({ service, onDone }: { service: Service | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      durationMinutes: service?.durationMinutes ?? 30,
      price: service?.price ?? 0,
      active: service?.active ?? true,
    },
  });
  const save = useMutation({
    mutationFn: (values: FormValues) =>
      service
        ? api(`/services/${service.id}`, { method: 'PATCH', body: values })
        : api('/services', { method: 'POST', body: values }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['services'] });
      onDone();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => save.mutate({ ...v, description: v.description || undefined }))}
      noValidate
      className="space-y-5"
      data-testid="service-form"
    >
      <Field label="Name" htmlFor="service-name" error={errors.name?.message}>
        <Input
          id="service-name"
          placeholder="e.g. Classic Haircut"
          invalid={!!errors.name}
          {...register('name')}
        />
      </Field>
      <Field
        label="Description"
        htmlFor="service-description"
        optional
        error={errors.description?.message}
        hint="Shown to clients on the booking page."
      >
        <Textarea id="service-description" rows={2} {...register('description')} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Duration (minutes)"
          htmlFor="service-duration"
          error={errors.durationMinutes?.message}
        >
          <Input
            id="service-duration"
            type="number"
            inputMode="numeric"
            min={5}
            step={5}
            invalid={!!errors.durationMinutes}
            {...register('durationMinutes')}
          />
        </Field>
        <Field label="Price (ARS)" htmlFor="service-price" error={errors.price?.message}>
          <Input
            id="service-price"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            invalid={!!errors.price}
            {...register('price')}
          />
        </Field>
      </div>
      <Checkbox
        label="Bookable online"
        description="Inactive services stay in your history but can't be booked."
        {...register('active')}
      />
      {save.isError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {save.error.message}
        </p>
      )}
      <div className="sticky -bottom-5 z-10 -mx-5 -mb-5 flex justify-end gap-2 border-t border-line bg-canvas px-5 py-3">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending} data-testid="save-service">
          Save service
        </Button>
      </div>
    </form>
  );
}
