import clsx from 'clsx';
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  LayoutGrid,
  ListChecks,
  LogOut,
  Menu,
  Scissors,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Avatar, BusinessMark, IconButton, Logo, Spinner } from '../../components/ui';

interface NavItem {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  testId: string;
  end?: boolean;
  adminOnly?: boolean;
}

const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: 'Workspace',
    items: [
      { to: '/app', label: 'Overview', icon: LayoutGrid, testId: 'nav-dashboard', end: true },
      { to: '/app/agenda', label: 'Agenda', icon: CalendarDays, testId: 'nav-agenda' },
      {
        to: '/app/appointments',
        label: 'Appointments',
        icon: ListChecks,
        testId: 'nav-appointments',
      },
      {
        to: '/app/reports',
        label: 'Reports',
        icon: BarChart3,
        testId: 'nav-reports',
        adminOnly: true,
      },
    ],
  },
  {
    title: 'Manage',
    items: [
      {
        to: '/app/services',
        label: 'Services',
        icon: Scissors,
        testId: 'nav-services',
        adminOnly: true,
      },
      { to: '/app/staff', label: 'Staff', icon: UserRound, testId: 'nav-staff', adminOnly: true },
      { to: '/app/clients', label: 'Clients', icon: Users, testId: 'nav-clients', adminOnly: true },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer on navigation.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/95 px-3 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <IconButton label="Open menu" onClick={() => setOpen(true)} data-testid="menu-button">
            <Menu className="size-5" aria-hidden />
          </IconButton>
          <BusinessMark name={user?.business.name ?? ''} size="sm" />
          <span className="truncate text-sm font-bold">{shortName(user?.business.name)}</span>
        </div>
        <IconButton
          label="Log out"
          onClick={() => void logout()}
          data-testid="logout-button-mobile"
        >
          <LogOut className="size-4" aria-hidden />
        </IconButton>
      </div>

      {/* Drawer backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-ink/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-line bg-surface transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0',
          open ? 'translate-x-0 shadow-pop' : '-translate-x-full',
        )}
        aria-label="Sidebar"
      >
        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
          <BusinessMark name={user?.business.name ?? ''} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold" title={user?.business.name}>
              {shortName(user?.business.name)}
            </p>
            <p className="truncate text-xs text-muted">{locationOf(user?.business.name)}</p>
          </div>
          <IconButton
            label="Close menu"
            size="sm"
            onClick={() => setOpen(false)}
            className="lg:hidden"
          >
            <X className="size-4" aria-hidden />
          </IconButton>
        </div>

        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
          {NAV.map((group) => {
            const items = group.items.filter((n) => !n.adminOnly || user?.role === 'ADMIN');
            if (items.length === 0) return null;
            return (
              <div key={group.title} className="mb-5">
                <p className="eyebrow px-3 pb-2">{group.title}</p>
                <ul className="space-y-0.5">
                  {items.map(({ to, label, icon: Icon, testId, end }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={end}
                        data-testid={testId}
                        className={({ isActive }) =>
                          clsx(
                            'group flex h-9 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors',
                            isActive
                              ? 'bg-forest text-white'
                              : 'text-ink-soft hover:bg-subtle hover:text-ink',
                          )
                        }
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <a
            href={`/book/${user?.business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mx-0 mt-2 flex items-center justify-between rounded-md border border-dashed border-line-strong px-3 py-2.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-forest hover:text-forest"
            data-testid="view-booking-page"
          >
            Public booking page
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <Avatar name={user?.name ?? '?'} color="#54856b" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" data-testid="current-user-name">
                {user?.name}
              </p>
              <p className="text-xs text-muted" data-testid="current-user-role">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Staff'}
              </p>
            </div>
            <IconButton
              label="Log out"
              size="sm"
              onClick={() => void logout()}
              data-testid="logout-button"
            >
              <LogOut className="size-4" aria-hidden />
            </IconButton>
          </div>
          <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-faint">
            <Logo className="scale-[0.8] origin-left opacity-70" />
            <NavLink to="/app/ui" className="hover:text-ink" data-testid="nav-ui-kit">
              UI kit
            </NavLink>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

/** "Barbería Costanera — Corrientes" → "Barbería Costanera" */
function shortName(name = '') {
  return name.split(/\s+[—–-]\s+/)[0];
}

/** "Barbería Costanera — Corrientes" → "Corrientes" */
function locationOf(name = '') {
  return name.split(/\s+[—–-]\s+/)[1] ?? 'Business workspace';
}
