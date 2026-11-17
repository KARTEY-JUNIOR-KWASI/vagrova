'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';

const INITIAL_PAYMENTS = [
  { ref: 'VG-DEP-179481', job: 'VGJ-004819', payer: 'James Ofori', kind: 'Deposit (50%)', method: 'MTN MoMo', amountGHS: '3,425.00', status: 'CONFIRMED', date: '16 Nov 2026 09:42' },
  { ref: 'VG-DEP-179479', job: 'VGJ-004825', payer: 'Volta Steel Works', kind: 'Deposit (50%)', method: 'Bank Transfer', amountGHS: '3,225.00', status: 'PROCESSING', date: '16 Nov 2026 09:10' },
  { ref: 'VG-PAYOUT-179450', job: 'VGJ-004818', payer: 'Kofi Mensah (Carrier)', kind: 'Provider Payout', method: 'MTN MoMo', amountGHS: '4,080.00', status: 'CONFIRMED', date: '15 Nov 2026 18:15' },
  { ref: 'VG-DEP-179412', job: 'VGJ-004817', payer: 'ATC Ghana Ltd', kind: 'Balance Held', method: 'Bank Transfer', amountGHS: '6,850.00', status: 'DISPUTED_HOLD', date: '15 Nov 2026 14:20' },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);

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
