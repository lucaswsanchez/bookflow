import { useQuery } from '@tanstack/react-query';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { BusinessMark, Button, ErrorState, PageHeader, Skeleton } from '../../components/ui';
import { api } from '../../lib/api';
import { splitBusinessName } from '../../lib/format';
import type { Business, Service, StaffMember } from '../../lib/types';

function Row({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-line px-5 py-3.5 last:border-b-0 sm:grid-cols-[200px_1fr] sm:gap-6">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className={mono ? 'mono text-[13px] text-ink' : 'text-sm text-ink'}>{children}</dd>
    </div>
  );
}

/**
 * Business settings: a read-only view of how the business is configured, built from the same
 * public profile clients see. Editing the profile is not exposed by the API yet.
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const slug = user?.business.slug ?? '';
  const business = useQuery({
    queryKey: ['business', slug],
    queryFn: () => api<Business>(`/public/businesses/${slug}`),
    enabled: !!slug,
  });
  const services = useQuery({ queryKey: ['services'], queryFn: () => api<Service[]>('/services') });
  const staff = useQuery({ queryKey: ['staff'], queryFn: () => api<StaffMember[]>('/staff') });
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}/book/${slug}`;
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const b = business.data;
  const { name, place } = splitBusinessName(b?.name);

  return (
    <div data-testid="settings-page">
      <PageHeader
        eyebrow="Settings"
        title="Business settings"
        description="How your business appears to clients and how the schedule is configured."
      />

      {business.isError ? (
        <ErrorState message="Couldn't load the business profile." onRetry={business.refetch} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section>
              <h2 className="mb-2 text-[14px] font-semibold">Profile</h2>
              <dl className="rounded-lg border border-line bg-surface shadow-soft">
                {b ? (
                  <>
                    <Row label="Name">{name}</Row>
                    <Row label="City">{place ?? '—'}</Row>
                    <Row label="Description">{b.description ?? '—'}</Row>
                    <Row label="Address">{b.address ?? '—'}</Row>
                    <Row label="Phone">{b.phone ?? '—'}</Row>
                  </>
                ) : (
                  <div className="space-y-3 p-5">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                )}
              </dl>
            </section>

            <section>
              <h2 className="mb-2 text-[14px] font-semibold">Scheduling</h2>
              <dl className="rounded-lg border border-line bg-surface shadow-soft">
                <Row label="Time zone" mono>
                  {b?.timezone ?? user?.business.timezone}
                </Row>
                <Row label="Currency" mono>
                  {b?.currency ?? '—'}
                </Row>
                <Row label="Active services" mono>
                  {services.data ? services.data.filter((s) => s.active !== false).length : '—'}
                </Row>
                <Row label="Professionals" mono>
                  {staff.data ? staff.data.filter((s) => s.active !== false).length : '—'}
                </Row>
                <Row label="Double booking">
                  Prevented by the database: overlapping appointments for the same professional are
                  rejected.
                </Row>
              </dl>
            </section>
          </div>

          <aside className="space-y-3">
            <div className="overflow-hidden rounded-lg bg-night text-night-text">
              <div className="flex items-center gap-3 border-b border-night-line px-4 py-3.5">
                <BusinessMark name={b?.name ?? user?.business.name ?? ''} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{name}</p>
                  <p className="eyebrow text-night-muted">Public booking page</p>
                </div>
              </div>
              <div className="px-4 py-3.5">
                <p
                  className="mono truncate rounded-md bg-night-2 px-2.5 py-2 text-[12px] text-white"
                  data-testid="booking-link"
                  title={link}
                >
                  {link}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => void copy()}
                    data-testid="copy-booking-link"
                  >
                    {copied ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <Copy className="size-3.5" aria-hidden />
                    )}
                    {copied ? 'Copied' : 'Copy link'}
                  </Button>
                  <a
                    href={`/book/${slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-night-3 text-[13px] font-medium text-white hover:bg-night-line"
                  >
                    Open
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </div>
              </div>
            </div>
            <p className="px-1 text-xs leading-relaxed text-muted">
              Share this link on Instagram, WhatsApp or Google Maps. Clients book without creating
              an account; available times come from your staff's working hours.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
