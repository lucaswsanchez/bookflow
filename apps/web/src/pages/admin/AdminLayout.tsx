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
  Settings2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { splitBusinessName } from '../../lib/format';
import { Avatar, BusinessMark, IconButton, LogoMark, Spinner } from '../../components/ui';

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
  {
    title: 'Settings',
    items: [
      {
        to: '/app/settings',
        label: 'Business settings',
        icon: Settings2,
        testId: 'nav-settings',
        adminOnly: true,
      },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const business = splitBusinessName(user?.business.name);

  // Close the mobile drawer on navigation.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-night px-3 text-white lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <IconButton
            label="Open menu"
            onClick={() => setOpen(true)}
            data-testid="menu-button"
            className="text-night-text hover:bg-night-3 hover:text-white"
          >
            <Menu className="size-5" aria-hidden />
          </IconButton>
          <LogoMark inverted className="size-6" />
          <span className="truncate text-sm font-medium">{business.name}</span>
        </div>
        <IconButton
          label="Log out"
          onClick={() => void logout()}
          data-testid="logout-button-mobile"
          className="text-night-text hover:bg-night-3 hover:text-white"
        >
          <LogOut className="size-4" aria-hidden />
        </IconButton>
      </div>

      {/* Drawer backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-night/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-night text-night-text transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0',
          open ? 'translate-x-0 shadow-pop' : '-translate-x-full',
        )}
        aria-label="Sidebar"
      >
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <span className="inline-flex items-center gap-2 text-[14px] font-semibold tracking-[-0.02em] text-white">
            <LogoMark inverted className="size-6" />
            BookFlow
          </span>
          <IconButton
            label="Close menu"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-night-muted hover:bg-night-3 hover:text-white lg:hidden"
          >
            <X className="size-4" aria-hidden />
          </IconButton>
        </div>

        <nav aria-label="Main" className="flex-1 overflow-y-auto px-2.5 pt-2 pb-4">
          {NAV.map((group) => {
            const items = group.items.filter((n) => !n.adminOnly || user?.role === 'ADMIN');
            if (items.length === 0) return null;
            return (
              <div key={group.title} className="mb-5">
                <p className="eyebrow px-2.5 pb-1.5 text-night-muted/80">{group.title}</p>
                <ul className="space-y-px">
                  {items.map(({ to, label, icon: Icon, testId, end }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={end}
                        data-testid={testId}
                        className={({ isActive }) =>
                          clsx(
                            'relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors',
                            isActive
                              ? 'bg-night-3 text-white before:absolute before:top-2 before:bottom-2 before:-left-2.5 before:w-0.5 before:rounded-r before:bg-accent'
                              : 'text-night-muted hover:bg-night-2 hover:text-white',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={clsx('size-4 shrink-0', isActive && 'text-accent')}
                              aria-hidden
                            />
                            {label}
                          </>
                        )}
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
            className="flex h-8 items-center justify-between rounded-md px-2.5 text-[13px] font-medium text-night-muted transition-colors hover:bg-night-2 hover:text-white"
            data-testid="view-booking-page"
          >
            Public booking page
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </nav>

        <div className="space-y-1 border-t border-night-line p-2.5">
          {/* Selected business (one per account) */}
          <div
            className="flex items-center gap-2.5 rounded-md bg-night-2 px-2.5 py-2"
            data-testid="current-business"
          >
            <BusinessMark name={user?.business.name ?? ''} size="sm" />
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[13px] font-medium text-white"
                title={user?.business.name}
              >
                {business.name}
              </p>
              <p className="truncate font-mono text-[11px] text-night-muted">
                /{user?.business.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-2.5 py-1.5">
            <Avatar name={user?.name ?? '?'} color="#526ff5" size="sm" />
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[13px] font-medium text-white"
                data-testid="current-user-name"
              >
                {user?.name}
              </p>
              <p className="font-mono text-[11px] text-night-muted" data-testid="current-user-role">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Staff'}
              </p>
            </div>
            <IconButton
              label="Log out"
              size="sm"
              onClick={() => void logout()}
              data-testid="logout-button"
              className="text-night-muted hover:bg-night-3 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden />
            </IconButton>
          </div>
          <div className="flex justify-end px-2.5">
            <NavLink
              to="/app/ui"
              className="font-mono text-[10.5px] text-night-muted/70 hover:text-white"
              data-testid="nav-ui-kit"
            >
              UI kit
            </NavLink>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
