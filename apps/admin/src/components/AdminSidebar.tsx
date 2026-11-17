'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  isAlert?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: '/call-center',
    label: 'Call Center',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 3C3 2.45 3.45 2 4 2h1.5l1 3-1.5.75a7 7 0 004.25 4.25L10 8.5l3 1V11c0 .55-.45 1-1 1C5.4 12 2 8.6 2 4v-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    badge: 3,
    isAlert: true,
  },
  {
    href: '/quotations',
    label: 'Quotations',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    badge: 7,
    isAlert: true,
  },
  {
    href: '/dispatch',
    label: 'Dispatch',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="2" x2="8" y2="4" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="12" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" />
        <line x1="2" y1="8" x2="4" y2="8" stroke="currentColor" strokeWidth="1.5" />
        <line x1="12" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    badge: 2,
    isAlert: true,
  },
  {
    href: '/vehicles',
    label: 'Vehicles',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="5" width="11" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="7" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="4" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="11" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  {
    href: '/verification',
    label: 'Verification',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    badge: 4,
  },
  {
    href: '/customers',
    label: 'Customers',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/pricing',
    label: 'Pricing',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v1.5M8 9.5V11M6.5 7c0-.8.7-1.5 1.5-1.5h.5c.8 0 1.5.7 1.5 1.5S9.3 8.5 8.5 8.5h-.5C7.2 8.5 6.5 7.8 6.5 7zM6 9c0 .8.7 1.5 1.5 1.5h.5c.8 0 1.5-.7 1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/payments',
    label: 'Payments',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="4" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <line x1="1" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="9" width="4" height="2" rx="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: '220px',
        flexShrink: 0,
        backgroundColor: '#0D6D78',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        height: '100vh',
      }}
    >
      {/* Official Brand Logo */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#FFFFFF',
          borderBottom: '3px solid #FFC600',
        }}
      >
        <img
          src="/vagrova-logo.png"
          alt="Vagrova"
          style={{
            width: '100%',
            maxWidth: '164px',
            height: 'auto',
            display: 'block',
          }}
        />
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#6B7075',
            marginTop: '6px',
          }}
        >
          Operations Desk
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '8px 0', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 16px',
                color: isActive ? '#FFC600' : 'rgba(255,255,255,0.65)',
                backgroundColor: isActive ? 'rgba(242,169,0,0.10)' : 'transparent',
                borderLeft: isActive ? '3px solid #FFC600' : '3px solid transparent',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 150ms ease',
                marginBottom: '1px',
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  style={{
                    backgroundColor: item.isAlert ? '#B3391B' : 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user info */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#FFC600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '13px',
            color: '#0D6D78',
            flexShrink: 0,
          }}
        >
          A
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>Admin User</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Super Admin</div>
        </div>
      </div>
    </aside>
  );
}

