import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import SkipLink from '../components/SkipLink.jsx';
import OfflineBanner from '../components/OfflineBanner.jsx';
import Button from '../components/Button.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', roles: ['WORKER', 'MANAGER', 'ADMIN'] },
  { to: '/tickets', label: 'Tickets', roles: ['WORKER', 'MANAGER', 'ADMIN'] },
  { to: '/tickets/new', label: 'Create Ticket', roles: ['WORKER', 'MANAGER', 'ADMIN'] },
  { to: '/validate', label: 'Validate Ticket', roles: ['WORKER', 'MANAGER', 'ADMIN'] },
  { to: '/workers', label: 'Workers', roles: ['MANAGER', 'ADMIN'] },
];

function linkClasses({ isActive }) {
  return `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-ink-100'
  }`;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-white">
      <SkipLink />
      <OfflineBanner />

      <header className="no-print border-b border-ink-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-ink-700 hover:bg-ink-100 md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <span className="text-lg font-semibold tracking-tight text-ink-900">
              Ticket QR Generator
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-600 sm:inline">
              {user?.name} · <span className="uppercase">{user?.role}</span>
            </span>
            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
        <nav id="mobile-nav" className={`px-4 pb-3 md:hidden ${menuOpen ? 'block' : 'hidden'}`} aria-label="Primary">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={linkClasses} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <nav className="no-print hidden w-56 shrink-0 md:block" aria-label="Primary">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={linkClasses} end={item.to === '/tickets'}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main id="main-content" className="min-w-0 flex-1" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
