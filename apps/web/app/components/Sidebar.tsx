'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import React, { useState, useEffect } from 'react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Master Sheet',
    href: '/admin/crm',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Pipeline',
    href: '/admin/pipeline',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="6" height="18" rx="1" /><rect x="9" y="8" width="6" height="13" rx="1" /><rect x="17" y="13" width="6" height="8" rx="1" />
      </svg>
    ),
  },
  {
    label: 'DISCOM Issues',
    href: '/admin/discom',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Net Meter Files',
    href: '/admin/net-meter',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4" /><path d="m6.34 6.34 2.83 2.83" /><path d="M2 12h4" /><path d="m6.34 17.66 2.83-2.83" /><path d="M12 18v4" /><path d="m14.83 14.83 2.83 2.83" /><path d="M18 12h4" /><path d="m14.83 9.17 2.83-2.83" />
      </svg>
    ),
  },
  {
    label: 'Employees',
    href: '/admin/employees',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Audit & History',
    href: '/admin/audit-logs',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /><path d="M3 12h1" /><path d="M20 12h1" />
      </svg>
    ),
  },
];

export default function Sidebar({ isOpen, onToggle }: { isOpen?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;

  // Close sidebar on route change (mobile) — using ref to avoid stale closures
  const prevPathRef = React.useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname && isOpen && onToggle) {
      onToggle();
    }
    prevPathRef.current = pathname;
  }, [pathname, isOpen, onToggle]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onToggle}
        />
      )}

      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" />
              </svg>
            </div>
            <span className="sidebar-label" style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--foreground)' }}>
              Arpit Solar
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href)) ? 'active' : ''}`}
            >
              {item.icon}
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}

          {user && (user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <Link
              href="/admin/users"
              className={`sidebar-link ${pathname === '/admin/users' ? 'active' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
              </svg>
              <span className="sidebar-label">User Management</span>
            </Link>
          )}
        </nav>

        {/* User Profile & Footer */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)' }}>
          <UserProfileFooter />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="sidebar-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginTop: '0.5rem' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span className="sidebar-label">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}

function UserProfileFooter() {
  const { data: session } = useSession();
  const user = session?.user as any;

  if (!user) return null;

  const roleColors: Record<string, string> = {
    ADMIN: '#ef4444', MANAGER: '#8b5cf6', SALESPERSON: '#3b82f6',
    TECHNICIAN: '#f59e0b', OFFICE_STAFF: '#10b981',
  };
  const color = roleColors[user.role] || '#64748b';

  return (
    <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
          {user.name || 'User'}
        </span>
        <span className="badge" style={{ background: `${color}22`, color, fontSize: '0.625rem', padding: '0.125rem 0.375rem' }}>
          {user.role || 'USER'}
        </span>
      </div>
      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {user.email}
      </span>
    </div>
  );
}
