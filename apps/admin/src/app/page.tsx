import React from 'react';
import { AdminShell } from '@/components/AdminShell';

// ─── Mock data ────────────────────────────────────────────────────────────────

const ACTION_ITEMS = [
  { label: 'New Quote Requests', count: 7, color: '#FFC600', href: '/quotations' },
  { label: 'Call-backs Waiting', count: 3, color: '#B3391B', href: '/call-center' },
  { label: 'Providers Pending Verification', count: 4, color: '#FFC600', href: '/verification' },
  { label: 'Jobs Without a Truck', count: 2, color: '#B3391B', href: '/dispatch' },
  { label: 'Documents Expiring This Week', count: 1, color: '#FFC600', href: '/vehicles' },
  { label: 'Payments to Confirm', count: 5, color: '#FFC600', href: '/payments' },
];

const METRICS_TODAY = [
  { label: 'Jobs Requested', value: '14' },
  { label: 'Quotes Sent', value: '9' },
  { label: 'Booked', value: '6' },
  { label: 'Completed', value: '4' },
  { label: 'Revenue (GHS)', value: '48,200' },
  { label: 'Commission (GHS)', value: '7,230' },
];

const METRICS_MONTH = [
  { label: 'Jobs Total', value: '312' },
  { label: 'Completion Rate', value: '88%' },
  { label: 'Revenue (GHS)', value: '1,042,800' },
  { label: 'Commission (GHS)', value: '156,420' },
  { label: 'Active Trucks', value: '47' },
  { label: 'Active Customers', value: '84' },
];

const RECENT_JOBS = [
  { id: 'VGJ-004821', customer: 'Accra Ready Mix Ltd', route: 'Tema Port → Spintex Rd', vehicle: 'Container Carrier', status: 'In Transit', driver: 'Kwame Asante', plate: 'GR-4521-23' },
  { id: 'VGJ-004820', customer: 'Mensah Construction', route: 'Accra → Kumasi', vehicle: 'Tipper', status: 'Being Priced', driver: '—', plate: '—' },
  { id: 'VGJ-004819', customer: 'James Ofori', route: 'Kasoa → Accra', vehicle: 'Flatbed', status: 'Booked', driver: 'Yaw Boateng', plate: 'GW-2290-22' },
  { id: 'VGJ-004818', customer: 'Volta Farms Co.', route: 'Ho → Accra', vehicle: 'Refrigerated', status: 'Completed', driver: 'Kofi Mensah', plate: 'GT-8812-21' },
  { id: 'VGJ-004817', customer: 'ATC Ghana Ltd', route: 'Accra → Takoradi', vehicle: 'Lowbed', status: 'Disputed', driver: 'Ama Boateng', plate: 'GS-6672-23' },
];

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
          <button className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Job
          </button>
        </div>

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

