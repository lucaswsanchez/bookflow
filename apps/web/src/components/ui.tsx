import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Inbox, Loader2, X } from 'lucide-react';
import {
  ButtonHTMLAttributes,
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useRef,
} from 'react';
import { STATUS_LABELS, STATUS_TONES } from '../lib/status';
import { dismissToast, useToasts } from '../lib/toast';
import type { AppointmentStatus } from '../lib/types';

/* ------------------------------------------------------------------------------------------ */
/* Buttons                                                                                    */
/* ------------------------------------------------------------------------------------------ */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent-strong text-white hover:bg-accent-deep shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]',
  secondary:
    'border border-line-strong bg-surface text-ink shadow-soft hover:border-faint hover:bg-canvas',
  subtle: 'bg-subtle text-ink hover:bg-line',
  ghost: 'text-ink-soft hover:bg-subtle hover:text-ink',
  danger: 'border border-danger-100 bg-surface text-danger hover:bg-danger-50',
  destructive: 'bg-danger text-white hover:brightness-95',
};

const BUTTON_SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-[15px]',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    loading?: boolean;
    size?: Size;
  }
>(function Button(
  { variant = 'primary', loading, size = 'md', className, children, disabled, type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55',
        BUTTON_SIZES[size],
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: 'sm' | 'md' }
>(function IconButton({ label, size = 'md', className, children, type, ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-subtle hover:text-ink disabled:opacity-50',
        size === 'sm' ? 'size-8' : 'size-9',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

/* ------------------------------------------------------------------------------------------ */
/* Surfaces                                                                                   */
/* ------------------------------------------------------------------------------------------ */

/** A bordered surface. Use sparingly: most content sits directly on the canvas. */
export function Card({
  className,
  children,
  ...props
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('rounded-lg border border-line bg-surface', className)} {...props}>
      {children}
    </div>
  );
}

/** Titled section with an optional action on the right and a hairline under the title. */
export function Section({
  title,
  description,
  action,
  children,
  className,
  testId,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section className={className} data-testid={testId}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A single KPI: label, big number and an optional footnote. No box: sits in a ruled row. */
export function Stat({
  label,
  value,
  hint,
  testId,
  tone = 'default',
  size = 'md',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  testId?: string;
  tone?: 'default' | 'accent';
  size?: 'md' | 'lg';
}) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{label}</p>
      <p
        data-testid={testId}
        className={clsx(
          'tabular mt-2 truncate leading-none font-medium',
          size === 'lg' ? 'text-[34px]' : 'text-[20px]',
          tone === 'accent' ? 'text-accent-ink' : 'text-ink',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-[13px] text-muted">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Feedback states                                                                            */
/* ------------------------------------------------------------------------------------------ */

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 py-12 text-muted"
      data-testid="loading"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx('animate-pulse rounded-md bg-line/70', className)} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      data-testid="error-state"
      className="flex flex-col items-center gap-3 rounded-lg border border-danger-100 bg-danger-50 px-4 py-8 text-center"
    >
      <AlertTriangle className="size-5 text-danger" aria-hidden />
      <p className="max-w-sm text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  testId = 'empty-state',
  icon,
  action,
}: {
  title: string;
  description?: string;
  testId?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong px-4 py-12 text-center"
    >
      <span className="mb-1 grid size-10 place-items-center rounded-full bg-subtle text-muted">
        {icon ?? <Inbox className="size-5" aria-hidden />}
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Form controls                                                                              */
/* ------------------------------------------------------------------------------------------ */

/** Controls stretch to their container unless the caller sets its own width (e.g. `w-auto`). */
const hasWidth = (className?: string) => /(^|\s)(w-|min-w-|max-w-)/.test(className ?? '');

const control = (invalid?: boolean, className?: string) =>
  clsx(
    !hasWidth(className) && 'w-full',
    'rounded-md border bg-surface px-3 text-sm text-ink shadow-soft transition-colors placeholder:text-faint focus:outline-none focus:ring-3 disabled:bg-subtle disabled:text-muted',
    invalid
      ? 'border-danger focus:ring-danger-100'
      : 'border-line-strong hover:border-faint focus:border-accent focus:ring-accent-100',
  );

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={clsx(control(invalid, className), 'h-9', className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={clsx(control(invalid, className), 'py-2', className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={clsx(
        control(invalid, className),
        'h-9 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2016%2016%27%20fill=%27none%27%20stroke=%27%23778191%27%20stroke-width=%271.6%27%3E%3Cpath%20d=%27m4%206%204%204%204-4%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  optional,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-baseline gap-1.5 text-[13px] font-medium text-ink"
      >
        {label}
        {optional && <span className="text-xs font-normal text-muted">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export function Checkbox({
  label,
  description,
  ...props
}: React.ComponentProps<'input'> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-sm border-line-strong accent-accent"
        {...props}
      />
      <span>
        {label}
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

/** Pill-shaped segmented control (e.g. Day / Week). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; testId?: string }[];
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-md border border-line bg-subtle p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          data-testid={o.testId}
          onClick={() => onChange(o.value)}
          className={clsx(
            'h-7 rounded-[5px] px-3 text-[13px] font-medium transition-colors',
            value === o.value
              ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(21_27_38/0.14)]'
              : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Data display                                                                               */
/* ------------------------------------------------------------------------------------------ */

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      data-testid="status-badge"
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-medium',
        STATUS_TONES[status].badge,
      )}
    >
      <span className={clsx('size-1.5 rounded-full', STATUS_TONES[status].dot)} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'signal' | 'danger';
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium',
        tone === 'neutral' && 'bg-subtle text-ink-soft',
        tone === 'accent' && 'bg-accent-50 text-accent-ink',
        tone === 'signal' && 'bg-signal-50 text-signal-700',
        tone === 'danger' && 'bg-danger-50 text-danger',
      )}
    >
      {children}
    </span>
  );
}

/** Round avatar with initials, tinted with the person's color. */
export function Avatar({
  name,
  color,
  size = 'md',
  className,
}: {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={clsx(
        'grid shrink-0 place-items-center rounded-full font-semibold text-white',
        size === 'sm' && 'size-6 text-[10px]',
        size === 'md' && 'size-8 text-xs',
        size === 'lg' && 'size-11 text-sm',
        className,
      )}
      style={{ backgroundColor: color ?? '#526ff5' }}
    >
      {initials}
    </span>
  );
}

/** Overlapping avatars with a white ring so initials stay readable. */
export function AvatarStack({ people }: { people: { id: string; name: string; color: string }[] }) {
  return (
    <span className="flex items-center">
      {people.map((p, i) => (
        <span key={p.id} title={p.name} className={i === 0 ? '' : '-ml-1'}>
          <Avatar name={p.name} color={p.color} size="sm" className="ring-2 ring-surface" />
        </span>
      ))}
    </span>
  );
}

/** Bordered table on a white surface. Scrolls horizontally on small screens. */
export function Table({
  children,
  className,
  fit,
}: {
  children: ReactNode;
  className?: string;
  /** Fit the container instead of scrolling (narrow tables with few columns). */
  fit?: boolean;
}) {
  return (
    <div
      className={clsx(
        'overflow-x-auto rounded-lg border border-line bg-surface shadow-soft',
        className,
      )}
    >
      <table
        className={clsx(
          'w-full border-collapse text-sm [&_tbody_tr:last-child>td]:border-b-0',
          !fit && 'min-w-[640px]',
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={clsx('eyebrow h-9 border-b border-line bg-canvas px-4 text-left', className)}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td className={clsx('border-b border-line px-4 py-2.5 align-middle', className)}>{children}</td>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Brand                                                                                      */
/* ------------------------------------------------------------------------------------------ */

/** The BookFlow mark: three booking slots. On dark surfaces the tile turns light. */
export function LogoMark({ inverted, className }: { inverted?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={clsx('size-7 shrink-0', className)}>
      <rect width="64" height="64" rx="14" fill={inverted ? '#2a3546' : '#151b26'} />
      <rect x="14" y="15" width="22" height="9" rx="2.5" fill="#526ff5" />
      <rect x="14" y="28" width="36" height="9" rx="2.5" fill="#d5dbe5" />
      <rect x="28" y="41" width="22" height="9" rx="2.5" fill="#f0b65c" />
    </svg>
  );
}

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]',
        inverted ? 'text-white' : 'text-ink',
        className,
      )}
    >
      <LogoMark inverted={inverted} />
      BookFlow
    </span>
  );
}

/**
 * The business's own mark: a monogram built from its name. Lets any business
 * (barbershop, clinic, studio) get an identity without uploading assets.
 */
export function BusinessMark({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const initials = name
    .replace(/[—–-].*$/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={clsx(
        'grid shrink-0 place-items-center rounded-md bg-night font-mono font-medium text-signal',
        size === 'sm' && 'size-8 text-sm',
        size === 'md' && 'size-10 text-lg',
        size === 'lg' && 'size-14 text-2xl',
        className,
      )}
    >
      {initials}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Overlays                                                                                   */
/* ------------------------------------------------------------------------------------------ */

export function Modal({
  title,
  description,
  open,
  onClose,
  children,
  footer,
  testId = 'modal',
  size = 'md',
}: {
  title: string;
  description?: ReactNode;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  testId?: string;
  size?: 'md' | 'lg';
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-night/45 sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        data-testid={testId}
        onMouseDown={(e) => e.stopPropagation()}
        className={clsx(
          'flex max-h-[92vh] w-full animate-rise flex-col rounded-t-xl bg-surface shadow-pop focus:outline-none sm:rounded-xl',
          size === 'md' ? 'sm:max-w-lg' : 'sm:max-w-2xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={`${testId}-title`} className="text-[15px] font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mt-1 -mr-2">
            <X className="size-4" aria-hidden />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-canvas px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Confirmation dialog for destructive actions (replaces window.confirm). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      testId="confirm-dialog"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={loading}
            onClick={onConfirm}
            data-testid="confirm-action"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-soft">{message}</p>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Toasts                                                                                     */
/* ------------------------------------------------------------------------------------------ */

/** Renders the toast stack. Mounted once at the app root; announced to screen readers. */
export function Toaster() {
  const items = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end"
      data-testid="toaster"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex animate-rise items-center gap-2.5 rounded-md bg-night px-3.5 py-2.5 text-[13px] text-white shadow-pop"
          data-testid="toast"
        >
          {t.tone === 'success' ? (
            <CheckCircle2 className="size-4 text-success-50" aria-hidden />
          ) : (
            <AlertTriangle className="size-4 text-signal" aria-hidden />
          )}
          {t.message}
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="-mr-1 ml-1 rounded-sm p-0.5 text-night-muted hover:text-white"
            aria-label="Dismiss"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
