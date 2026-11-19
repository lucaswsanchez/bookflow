import { CalendarPlus, Download, Pencil, Plus } from 'lucide-react';
import { ReactNode, useState } from 'react';
import {
  Avatar,
  Badge,
  BusinessMark,
  Button,
  Checkbox,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  Logo,
  Modal,
  PageHeader,
  Section,
  Segmented,
  Select,
  Skeleton,
  Spinner,
  Stat,
  StatusBadge,
  Table,
  Td,
  Textarea,
  Th,
} from '../../components/ui';
import type { AppointmentStatus } from '../../lib/types';

const SWATCHES = [
  ['night', '#151B26', 'Navigation, dark panels'],
  ['night-2', '#202A38', 'Raised dark surfaces'],
  ['canvas', '#F6F7F9', 'Paper background'],
  ['surface', '#FFFFFF', 'Content surfaces'],
  ['accent', '#526FF5', 'Actions, focus, selection'],
  ['signal', '#F0B65C', 'Now, attention'],
  ['success', '#1F8A62', 'Completed'],
  ['ink', '#202632', 'Text'],
  ['muted', '#778191', 'Secondary text'],
  ['line', '#E5E8EE', 'Borders'],
] as const;

const STATUSES: AppointmentStatus[] = ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 py-5 sm:grid-cols-[180px_1fr]">
      <p className="text-[13px] font-semibold text-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/** Internal page that renders every design-system primitive, for visual review. */
export default function UiShowcasePage() {
  const [view, setView] = useState<'day' | 'week'>('day');
  const [open, setOpen] = useState(false);

  return (
    <div data-testid="ui-showcase">
      <PageHeader
        eyebrow="Design system"
        title="UI showcase"
        description="Every primitive used across BookFlow, in one place."
      />

      <Section title="Brand & typography">
        <div className="divide-y divide-line">
          <Row label="Marks">
            <Logo />
            <BusinessMark name="Barbería Costanera — Corrientes" />
            <BusinessMark name="Estudio Kine Norte" size="sm" />
          </Row>
          <Row label="Display">
            <p className="text-4xl font-semibold tracking-[-0.035em]">Book your next visit</p>
          </Row>
          <Row label="Headings">
            <div className="space-y-1">
              <p className="text-[22px] font-semibold tracking-[-0.02em]">
                Page title · Geist 22 / semibold
              </p>
              <p className="text-[14px] font-semibold">Section title · 14 / semibold</p>
              <p className="text-sm">Body · 14 / regular</p>
              <p className="text-[13px] text-muted">Secondary · 13 / muted</p>
              <p className="eyebrow">Eyebrow · Geist Mono 10.5 / caps</p>
              <p className="tabular text-sm">Data · Geist Mono · 09:30 · $ 12.000 · BF-7K2Q</p>
            </div>
          </Row>
          <Row label="Palette">
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-5">
              {SWATCHES.map(([token, hex, use]) => (
                <div key={token}>
                  <div
                    className="h-12 rounded-md border border-line"
                    style={{ backgroundColor: hex }}
                  />
                  <p className="mt-1.5 text-xs font-semibold">{token}</p>
                  <p className="text-[11px] text-muted">
                    {hex} · {use}
                  </p>
                </div>
              ))}
            </div>
          </Row>
        </div>
      </Section>

      <Section title="Actions" className="mt-10">
        <div className="divide-y divide-line">
          <Row label="Buttons">
            <Button>
              <Plus className="size-4" aria-hidden /> Primary
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
          </Row>
          <Row label="Sizes">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <IconButton label="Edit">
              <Pencil className="size-4" aria-hidden />
            </IconButton>
            <IconButton label="Download" size="sm">
              <Download className="size-4" aria-hidden />
            </IconButton>
          </Row>
          <Row label="Segmented">
            <Segmented
              label="View"
              value={view}
              onChange={setView}
              options={[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
              ]}
            />
          </Row>
          <Row label="Modal">
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Open modal
            </Button>
          </Row>
        </div>
      </Section>

      <Section title="Forms" className="mt-10">
        <div className="grid max-w-2xl gap-5 py-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="ui-name">
            <Input id="ui-name" placeholder="Ana Gómez" />
          </Field>
          <Field label="Phone" htmlFor="ui-phone" error="Enter a valid phone number">
            <Input id="ui-phone" invalid defaultValue="12" />
          </Field>
          <Field label="Professional" htmlFor="ui-staff" hint="Only active staff are listed">
            <Select id="ui-staff">
              <option>Martín Acosta</option>
              <option>Lucía Benítez</option>
            </Select>
          </Field>
          <Field label="Email" htmlFor="ui-email" optional>
            <Input id="ui-email" type="email" placeholder="ana@example.com" disabled />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes" htmlFor="ui-notes" optional>
              <Textarea id="ui-notes" rows={3} placeholder="Anything we should know?" />
            </Field>
          </div>
          <Checkbox
            label="Active"
            description="Visible on the public booking page"
            defaultChecked
          />
        </div>
      </Section>

      <Section title="Data display" className="mt-10">
        <div className="divide-y divide-line">
          <Row label="Status">
            {STATUSES.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </Row>
          <Row label="Badges">
            <Badge>Neutral</Badge>
            <Badge tone="accent">Active</Badge>
            <Badge tone="signal">Inactive</Badge>
            <Badge tone="danger">Overdue</Badge>
          </Row>
          <Row label="Avatars">
            <Avatar name="Martín Acosta" color="#526ff5" size="sm" />
            <Avatar name="Lucía Benítez" color="#c47a1c" />
            <Avatar name="Diego Ramírez" color="#b08a63" size="lg" />
          </Row>
          <Row label="Stats">
            <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-4">
              <Stat label="Revenue today" value="$ 58.500" hint="7 appointments" tone="accent" />
              <Stat label="This week" value="94" hint="appointments" />
              <Stat label="Occupancy" value="62%" hint="of working hours" />
              <Stat label="No-shows" value="3" hint="this week" />
            </div>
          </Row>
        </div>
        <div className="mt-4">
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Client</Th>
                <Th>Service</Th>
                <Th>Status</Th>
                <Th className="text-right">Price</Th>
              </tr>
            </thead>
            <tbody>
              {STATUSES.map((s, i) => (
                <tr key={s}>
                  <Td className="tabular font-semibold">{`1${i}:00`}</Td>
                  <Td>Sample client {i + 1}</Td>
                  <Td className="text-muted">Classic Haircut</Td>
                  <Td>
                    <StatusBadge status={s} />
                  </Td>
                  <Td className="tabular text-right">$ 9.000</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Section>

      <Section title="States" className="mt-10">
        <div className="grid gap-4 py-5 md:grid-cols-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Spinner />
          </div>
          <EmptyState
            title="No appointments"
            description="Nothing booked for this day yet."
            testId="ui-empty"
            icon={<CalendarPlus className="size-5" aria-hidden />}
          />
          <ErrorState message="We couldn't load this page." onRetry={() => undefined} />
        </div>
      </Section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Modal title"
        description="Optional description under the title."
        testId="ui-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Modals slide up from the bottom on phones and are centered on larger screens.
        </p>
      </Modal>
    </div>
  );
}
