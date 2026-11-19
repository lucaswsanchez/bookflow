import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../auth/useAuth';
import { Loader2 } from 'lucide-react';
import { Button, Field, Input, Logo } from '../components/ui';
import { ApiError } from '../lib/api';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginValues = z.infer<typeof schema>;

const DEMO = {
  admin: { email: 'admin@demo.com', password: 'Admin123!' },
  staff: { email: 'staff@demo.com', password: 'Staff123!' },
};

export function LoginForm({ onSubmit }: { onSubmit: (values: LoginValues) => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await onSubmit(values);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 429
          ? 'Too many attempts. Please wait a minute and try again.'
          : e instanceof Error
            ? e.message
            : 'Login failed',
      );
    }
  });

  const fill = (creds: LoginValues) => {
    setValue('email', creds.email, { shouldValidate: true });
    setValue('password', creds.password, { shouldValidate: true });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5" data-testid="login-form">
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          invalid={!!errors.email}
          data-testid="login-email"
          {...register('email')}
        />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          invalid={!!errors.password}
          data-testid="login-password"
          {...register('password')}
        />
      </Field>
      {error && (
        <p
          role="alert"
          className="rounded-md bg-danger-50 px-3 py-2.5 text-sm font-medium text-danger"
          data-testid="login-error"
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={isSubmitting}
        data-testid="login-submit"
      >
        Log in
      </Button>
      <div className="border-t border-line pt-5">
        <p className="eyebrow mb-3">Try a demo account</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fill(DEMO.admin)}
            data-testid="fill-demo-admin"
            className="rounded-md border border-line-strong bg-surface px-3 py-2.5 text-left shadow-soft transition-colors hover:border-accent hover:bg-accent-50"
          >
            <span className="block text-[13px] font-medium">Admin</span>
            <span className="block truncate text-xs text-muted">Full access</span>
          </button>
          <button
            type="button"
            onClick={() => fill(DEMO.staff)}
            data-testid="fill-demo-staff"
            className="rounded-md border border-line-strong bg-surface px-3 py-2.5 text-left shadow-soft transition-colors hover:border-accent hover:bg-accent-50"
          >
            <span className="block text-[13px] font-medium">Staff</span>
            <span className="block truncate text-xs text-muted">Own agenda only</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  // One-click demo from the landing page: /login?demo=admin or /login?demo=staff
  const [params] = useSearchParams();
  const demo = params.get('demo') as keyof typeof DEMO | null;
  const started = useRef(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  useEffect(() => {
    if (status !== 'anonymous' || !demo || !(demo in DEMO) || started.current) return;
    started.current = true;
    login(DEMO[demo].email, DEMO[demo].password)
      .then(() => navigate('/app', { replace: true }))
      .catch((e: unknown) => setDemoError(e instanceof Error ? e.message : 'Login failed'));
  }, [status, demo, login, navigate]);

  if (status === 'authenticated') return <Navigate to={from} replace />;
  if (demo && demo in DEMO && !demoError) {
    return (
      <main className="grid min-h-screen place-items-center bg-night px-4 text-center text-night-text">
        <div data-testid="demo-signing-in">
          <Logo inverted className="justify-center" />
          <p className="mt-6 flex items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Opening the {demo} demo…
          </p>
          <p className="mt-2 max-w-xs text-xs text-night-muted">
            The demo API runs on a free tier: the first request may take up to a minute.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-night p-12 text-white lg:flex">
        <Link to="/" aria-label="BookFlow home">
          <Logo inverted />
        </Link>
        <div className="max-w-md">
          <p className="eyebrow mb-5 text-signal">BookFlow workspace</p>
          <p className="text-[40px] leading-[1.05] font-semibold tracking-[-0.035em] text-white">
            Your whole day, in one calm agenda.
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-night-muted">
            Clients book online, the schedule fills itself, and every professional sees exactly what
            is next.
          </p>
        </div>
        <ul className="grid grid-cols-3 gap-6 border-t border-night-line pt-6 text-[13px] text-night-muted">
          <li>
            <span className="tabular block text-xl font-medium text-white">24/7</span>
            online booking
          </li>
          <li>
            <span className="tabular block text-xl font-medium text-white">0</span>
            double bookings
          </li>
          <li>
            <span className="tabular block text-xl font-medium text-white">4</span>
            steps to book
          </li>
        </ul>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link to="/" aria-label="BookFlow home" className="lg:hidden">
            <Logo />
          </Link>
          <h1 className="mt-8 text-[26px] font-semibold tracking-[-0.03em] lg:mt-0">
            Welcome back
          </h1>
          <p className="mt-1 mb-8 text-sm text-muted">Log in to manage your agenda.</p>
          {demoError && (
            <p
              role="alert"
              className="mb-5 rounded-md bg-danger-50 px-3 py-2.5 text-sm text-danger"
            >
              {demoError}
            </p>
          )}
          <LoginForm
            onSubmit={async ({ email, password }) => {
              await login(email, password);
              navigate(from, { replace: true });
            }}
          />
          <p className="mt-8 text-xs leading-relaxed text-muted">
            The demo API runs on a free tier: the first request may take ~50s while it wakes up.
          </p>
        </div>
      </main>
    </div>
  );
}
