import clsx from 'clsx';
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Scissors,
  UserRound,
  Users,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Button, Logo } from '../../components/ui';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, testId: 'nav-dashboard', end: true },
  { to: '/app/agenda', label: 'Agenda', icon: CalendarDays, testId: 'nav-agenda' },
  {
    to: '/app/services',
    label: 'Services',
    icon: Scissors,
    testId: 'nav-services',
    adminOnly: true,
  },
  { to: '/app/staff', label: 'Staff', icon: UserRound, testId: 'nav-staff', adminOnly: true },
  { to: '/app/clients', label: 'Clients', icon: Users, testId: 'nav-clients', adminOnly: true },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const items = NAV.filter((n) => !n.adminOnly || user?.role === 'ADMIN');

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-5">
          <Logo />
          <p
            className="mt-1 hidden truncate text-xs text-slate-500 lg:block"
            title={user?.business.name}
          >
            {user?.business.name}
          </p>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3">
          {items.map(({ to, label, icon: Icon, testId, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={testId}
              className={({ isActive }) =>
                clsx(
                  'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden space-y-3 border-t border-slate-200 p-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <a
            href={`/book/${user?.business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-700"
            data-testid="view-booking-page"
          >
            <ExternalLink className="size-4" aria-hidden /> Public booking page
          </a>
          <UserBox />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          <span className="text-sm text-slate-600">{user?.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void logout()}
            data-testid="logout-button-mobile"
          >
            <LogOut className="size-4" aria-hidden /> Log out
          </Button>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function UserBox() {
  const { user, logout } = useAuth();
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900" data-testid="current-user-name">
          {user?.name}
        </p>
        <p className="text-xs text-slate-500" data-testid="current-user-role">
          {user?.role === 'ADMIN' ? 'Administrator' : 'Staff'}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void logout()}
        aria-label="Log out"
        data-testid="logout-button"
      >
        <LogOut className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
