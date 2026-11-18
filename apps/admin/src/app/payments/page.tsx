'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { adminApi } from '@/lib/api';

interface PaymentRow {
  ref: string;
  job: string;
  payer: string;
  kind: string;
  method: string;
  amountGHS: string;
  status: string;
  date: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vagrova_admin_token') : null;
    if (!token) return;
    adminApi
      .listAdminPayments()
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        setPayments(
          rows.map((p: any) => ({
            ref: p.providerRef || p.id.slice(0, 10).toUpperCase(),
            job: p.job?.jobRequest?.jobNumber || '—',
            payer: p.job?.jobRequest?.customer?.user?.name || 'Customer',
            kind: 'Booking Payment',
            method: String(p.method || 'MOMO').replace(/_/g, ' '),
            amountGHS: (Number(p.amountMinorUnits || 0) / 100).toLocaleString('en-GH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            status: p.status || 'PENDING',
            date: new Date(p.createdAt).toLocaleString(),
          })),
        );
      })
      .catch(() => {});
  }, []);

  const handleConfirmManual = (ref: string) => {
    setPayments(
      payments.map((p) => (p.ref === ref ? { ...p, status: 'CONFIRMED' } : p)),
    );
  };

  return (
    <AdminShell>
      <div style={{ maxWidth: '1400px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, color: '#0D6D78' }}>
            Payments & Settlements
          </h1>
          <p style={{ color: '#6B7075', fontSize: '13px', marginTop: '2px' }}>
            Customer MoMo/bank deposits, carrier payouts, and double-entry ledger reconciliation.
          </p>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Job No.</th>
                <th>Party</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount (GHS)</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const isConfirmed = p.status === 'CONFIRMED';
                const isHeld = p.status === 'DISPUTED_HOLD';
                return (
                  <tr key={p.ref}>
                    <td style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', fontWeight: 600 }}>{p.ref}</td>
                    <td style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }}>{p.job}</td>
                    <td style={{ fontWeight: 600 }}>{p.payer}</td>
                    <td>{p.kind}</td>
                    <td>{p.method}</td>
                    <td style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700 }}>{p.amountGHS}</td>
                    <td style={{ fontSize: '12px', color: '#6B7075' }}>{p.date}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderLeft: `3px solid ${isConfirmed ? '#2E7D4F' : isHeld ? '#B3391B' : '#FFC600'}`,
                          backgroundColor: isConfirmed ? '#D4EEE0' : isHeld ? '#F5D5CF' : '#FFF5D6',
                          color: isConfirmed ? '#1C5235' : isHeld ? '#7C2712' : '#7A5300',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '0 3px 3px 0',
                        }}
                      >
                        {isConfirmed ? <CheckCircle2 size={11} /> : isHeld ? <AlertTriangle size={11} /> : <Clock size={11} />}
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {p.status === 'PROCESSING' ? (
                        <button
                          className="btn-primary"
                          style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
                          onClick={() => handleConfirmManual(p.ref)}
                        >
                          Confirm Proof
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#BCB8B1' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
