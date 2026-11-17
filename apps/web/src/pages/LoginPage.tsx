import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../auth/useAuth';
import { Button, Card, Field, Input, Logo } from '../components/ui';
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
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="login-form">
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
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="login-error"
        >
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" loading={isSubmitting} data-testid="login-submit">
        Log in
      </Button>
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <p className="mb-2 font-medium text-slate-700">Try a demo account</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fill(DEMO.admin)}
            data-testid="fill-demo-admin"
          >
            Admin
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fill(DEMO.staff)}
            data-testid="fill-demo-staff"
          >
            Staff
          </Button>
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

  if (status === 'authenticated') return <Navigate to={from} replace />;

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-brand-50 to-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" aria-label="BookFlow home">
            <Logo className="text-xl" />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500">Log in to manage your agenda.</p>
        </div>
        <Card className="p-6">
          <LoginForm
            onSubmit={async ({ email, password }) => {
              await login(email, password);
              navigate(from, { replace: true });
            }}
          />
        </Card>
        <p className="text-center text-xs text-slate-500">
          First request may take ~50s while the free-tier server wakes up.
        </p>
      </div>
    </div>
  );
}
