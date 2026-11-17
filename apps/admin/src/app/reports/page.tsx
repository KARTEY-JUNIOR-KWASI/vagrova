'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';

const PNL_SUMMARY = [
  { label: 'Gross Freight Volume (Month)', value: 'GHS 1,042,800.00' },
  { label: 'Platform Commission (15%)', value: 'GHS 156,420.00' },
  { label: 'Provider Payouts Disbursed', value: 'GHS 886,380.00' },
  { label: 'Operating Expenses', value: 'GHS 38,900.00' },
  { label: 'Net Operating Profit', value: 'GHS 117,520.00' },
  { label: 'Operating Margin', value: '75.1%' },
];

const PERFORMANCE_METRICS = [
  { metric: 'Quote-to-Booking Conversion', value: '64.2%', target: '60.0%' },
  { metric: 'Driver Offer Acceptance Rate', value: '82.5%', target: '80.0%' },
  { metric: 'On-Time Pickup Rate', value: '91.0%', target: '90.0%' },
  { metric: 'Call-Center Callback SLA (<5 min)', value: '96.4%', target: '95.0%' },
  { metric: 'Average Quote Turnaround', value: '14 min', target: '< 20 min' },
];

export default function ReportsPage() {
  const handleDownloadCsv = (type: string) => {
    const csv = `ReportType,GeneratedAt,Currency\n${type},${new Date().toISOString()},GHS\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vagrova_${type}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell>
      <div style={{ maxWidth: '1400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, color: '#0D6D78' }}>
              Financial & Operational Reports
            </h1>
            <p style={{ color: '#6B7075', fontSize: '13px', marginTop: '2px' }}>
              Profit & loss, commission breakdown, SLA metrics, and accounting CSV exports.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={() => handleDownloadCsv('payouts')}>
              <Download size={13} /> Export Payouts CSV
            </button>
            <button className="btn-primary" onClick={() => handleDownloadCsv('pnl')}>
              <Download size={13} /> Export P&L CSV
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {PNL_SUMMARY.map((item) => (
            <div key={item.label} className="metric-tile">
              <div style={{ fontSize: '11px', color: '#6B7075', fontWeight: 600, marginBottom: '6px' }}>{item.label}</div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '20px', fontWeight: 700, color: '#0D6D78' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Operational KPI</th>
                <th>Current Period</th>
                <th>Target SLA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PERFORMANCE_METRICS.map((row) => (
                <tr key={row.metric}>
                  <td style={{ fontWeight: 600 }}>{row.metric}</td>
                  <td style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700 }}>{row.value}</td>
                  <td style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#6B7075' }}>{row.target}</td>
                  <td>
                    <span style={{ borderLeft: '3px solid #2E7D4F', backgroundColor: '#D4EEE0', color: '#1C5235', fontSize: '10px', fontWeight: 700, padding: '2px 8px' }}>
                      ON TARGET
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
