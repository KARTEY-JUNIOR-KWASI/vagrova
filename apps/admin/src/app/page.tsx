'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { adminApi } from '@/lib/api';

const STATUS_COLORS: Record<string, { bg: string; text: string; edge: string }> = {
  'In Transit':    { bg: '#D4EEE0', text: '#1C5235', edge: '#2E7D4F' },
  'Being Priced':  { bg: '#FFF5D6', text: '#7A5300', edge: '#FFC600' },
  'Booked':        { bg: '#D4EEE0', text: '#1C5235', edge: '#2E7D4F' },
  'Completed':     { bg: '#D4EEE0', text: '#1C5235', edge: '#2E7D4F' },
  'Disputed':      { bg: '#F5D5CF', text: '#7C2712', edge: '#B3391B' },
  'Assigned':      { bg: '#D4EEE0', text: '#1C5235', edge: '#2E7D4F' },
  'Requested':     { bg: '#F0EDE8', text: '#4A4F53', edge: '#6B7075' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [quoteCount, setQuoteCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [truckCount, setTruckCount] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadDashboard = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vagrova_admin_token') : null;
    if (!token) return;
    setApiError(null);
    adminApi.listAdminJobs().then((rows) => { if (Array.isArray(rows)) setRecentJobs(rows); }).catch((e) => setApiError(e?.message || 'Unable to load jobs'));
    adminApi.getQuotesQueue().then((rows) => { if (Array.isArray(rows)) setQuoteCount(rows.length); }).catch((e) => setApiError(e?.message || 'Unable to load quote queue'));
    adminApi.listAdminCustomers().then((rows) => { if (Array.isArray(rows)) setCustomerCount(rows.length); }).catch(() => {});
    adminApi.listAdminTrucks().then((rows) => { if (Array.isArray(rows)) setTruckCount(rows.length); }).catch(() => {});
  };

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(loadDashboard, 15000);
    return () => clearInterval(timer);
  }, []);

  const ACTION_ITEMS = [
    { label: 'New Quote Requests', count: quoteCount, color: '#FFC600', href: '/quotations' },
    { label: 'Call-backs Waiting', count: 0, color: '#B3391B', href: '/call-center' },
    { label: 'Providers Pending Verification', count: 0, color: '#FFC600', href: '/verification' },
    { label: 'Jobs Without a Truck', count: recentJobs.filter((j) => !j.assignments?.length).length, color: '#B3391B', href: '/dispatch' },
    { label: 'Documents Expiring This Week', count: 0, color: '#FFC600', href: '/vehicles' },
    { label: 'Payments to Confirm', count: 0, color: '#FFC600', href: '/payments' },
  ];

  const METRICS_TODAY = [
    { label: 'Jobs Requested', value: String(quoteCount) },
    { label: 'Quotes Sent', value: '0' },
    { label: 'Booked', value: String(recentJobs.length) },
    { label: 'Completed', value: String(recentJobs.filter((j) => j.status === 'COMPLETED').length) },
    { label: 'Revenue (GHS)', value: '0' },
    { label: 'Commission (GHS)', value: '0' },
  ];

  const METRICS_MONTH = [
    { label: 'Jobs Total', value: String(recentJobs.length) },
    { label: 'Completion Rate', value: recentJobs.length ? `${Math.round((recentJobs.filter((j) => j.status === 'COMPLETED').length / recentJobs.length) * 100)}%` : '0%' },
    { label: 'Revenue (GHS)', value: '0' },
    { label: 'Commission (GHS)', value: '0' },
    { label: 'Active Trucks', value: String(truckCount) },
    { label: 'Active Customers', value: String(customerCount) },
  ];

  const RECENT_JOBS = recentJobs.slice(0, 10).map((j: any) => ({
    id: j.jobRequest?.jobNumber || j.id,
    customer: j.jobRequest?.customer?.user?.name || 'Customer',
    route: `${j.jobRequest?.pickupAddress || 'Pickup'} → ${j.jobRequest?.deliveryAddress || 'Dropoff'}`,
    vehicle: j.jobRequest?.equipmentType?.name || j.jobRequest?.vehicleType || 'Truck',
    status: j.status || 'Requested',
    driver: j.assignments?.[0]?.driver?.user?.name || '—',
    plate: j.assignments?.[0]?.vehicle?.plateNumber || '—',
  }));
  return (
    <AdminShell>
      <div style={{ maxWidth: '1400px' }}>

        {/* Page heading */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.01em', color: '#0D6D78' }}>
              Operations Dashboard
            </h1>
            <p style={{ color: '#6B7075', fontSize: '13px', marginTop: '2px' }}>
              Monday, 16 Nov 2026 · Accra, GH · GHS
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={loadDashboard} className="btn-secondary">
              Refresh Live Data
            </button>
            <button className="btn-primary">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              New Job
            </button>
          </div>
        </div>

        {apiError && (
          <div style={{ backgroundColor: '#FADBD8', color: '#87241B', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 700 }}>
            Admin API Notice: {apiError} — Try signing out (top right) and signing back in with your Admin phone.
          </div>
        )}

        {quoteCount > 0 && (
          <a
            href="/quotations"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFC600',
              color: '#0D6D78',
              padding: '12px 18px',
              borderRadius: '8px',
              marginBottom: '16px',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '14px',
            }}
          >
            <span>New Order Alert: {quoteCount} customer booking request{quoteCount === 1 ? '' : 's'} waiting for review!</span>
            <span>Open Quotations →</span>
          </a>
        )}

        {/* ACTION REQUIRED banner */}
        <section style={{ marginBottom: '24px' }}>
          <div style={{
            backgroundColor: '#0D6D78',
            borderRadius: '6px',
            padding: '14px 20px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{ color: '#FFC600', fontFamily: '"Archivo", sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Needs Action
            </div>
            <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
              Items requiring immediate attention
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {ACTION_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DDD9D1',
                  borderLeft: `4px solid ${item.color}`,
                  borderRadius: '0 6px 6px 0',
                  padding: '12px 16px',
                  textDecoration: 'none',
                  transition: 'box-shadow 150ms',
                }}
              >
                <span style={{ fontSize: '13px', color: '#0D6D78', fontWeight: 500 }}>{item.label}</span>
                <span style={{
                  fontFamily: '"Archivo", sans-serif',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: item.color,
                  letterSpacing: '-0.02em',
                }}>
                  {item.count}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Metrics — Today */}
        <section style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7075', marginBottom: '10px' }}>
            Today
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
            {METRICS_TODAY.map((m) => (
              <div key={m.label} className="metric-tile">
                <div style={{ fontSize: '11px', color: '#6B7075', fontWeight: 500, letterSpacing: '0.03em', marginBottom: '6px' }}>{m.label}</div>
                <div style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, color: '#0D6D78', letterSpacing: '-0.02em' }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Metrics — This Month */}
        <section style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7075', marginBottom: '10px' }}>
            This Month
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
            {METRICS_MONTH.map((m) => (
              <div key={m.label} className="metric-tile">
                <div style={{ fontSize: '11px', color: '#6B7075', fontWeight: 500, letterSpacing: '0.03em', marginBottom: '6px' }}>{m.label}</div>
                <div style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, color: '#0D6D78', letterSpacing: '-0.02em' }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Jobs */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7075' }}>
              Recent Jobs
            </div>
            <a href="/dispatch" style={{ fontSize: '12px', color: '#FFC600', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job No.</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Plate</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {RECENT_JOBS.map((job) => {
                  const sc = STATUS_COLORS[job.status] ?? STATUS_COLORS['Requested'];
                  return (
                    <tr key={job.id}>
                      <td>
                        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#0D6D78', letterSpacing: '0.04em' }}>
                          {job.id}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{job.customer}</td>
                      <td style={{ color: '#6B7075', fontSize: '12px' }}>{job.route}</td>
                      <td>{job.vehicle}</td>
                      <td>{job.driver}</td>
                      <td>
                        {job.plate !== '—' ? (
                          <span style={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: '#0D6D78',
                            backgroundColor: '#EBF2F3',
                            border: '1.5px solid #0D6D78',
                            borderRadius: '2px',
                            padding: '1px 6px',
                          }}>
                            {job.plate}
                          </span>
                        ) : (
                          <span style={{ color: '#BCB8B1' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          borderLeft: `3px solid ${sc.edge}`,
                          backgroundColor: sc.bg,
                          color: sc.text,
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '0 3px 3px 0',
                        }}>
                          {job.status}
                        </span>
                      </td>
                      <td>
                        <a href={`/jobs/${job.id}`} style={{ color: '#FFC600', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>Open →</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </AdminShell>
  );
}

