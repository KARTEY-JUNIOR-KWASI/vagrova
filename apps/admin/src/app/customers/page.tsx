'use client';

import React, { useState } from 'react';
import { Building2, User as UserIcon, Flag } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';

const CUSTOMERS = [
  { id: 'CUS-1042', name: 'Accra Ready Mix Ltd', type: 'COMPANY', phone: '+233 24 410 9988', jobs: 28, balanceGHS: '0.00', notes: 'Prefers Tema Port morning slots', flagged: false },
  { id: 'CUS-1041', name: 'Mensah Construction', type: 'COMPANY', phone: '+233 24 450 1234', jobs: 14, balanceGHS: '3,425.00', notes: 'Balance due on VGJ-004820', flagged: false },
  { id: 'CUS-1039', name: 'James Ofori', type: 'INDIVIDUAL', phone: '+233 55 782 9900', jobs: 3, balanceGHS: '0.00', notes: 'Site access requires 4x4 escort in rainy season', flagged: false },
  { id: 'CUS-1035', name: 'ATC Ghana Ltd', type: 'COMPANY', phone: '+233 20 100 4455', jobs: 19, balanceGHS: '6,850.00', notes: 'Disputed waiting-time invoice on VGJ-004817', flagged: true },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const filtered = CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  return (
    <AdminShell>
      <div style={{ maxWidth: '1400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, color: '#0D6D78' }}>
              Customer Database
            </h1>
            <p style={{ color: '#6B7075', fontSize: '13px', marginTop: '2px' }}>
              Contractors, factories, traders, and individual shippers.
            </p>
          </div>
          <input
            className="input"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '260px' }}
          />
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Account Type</th>
                <th>Phone</th>
                <th>Total Jobs</th>
                <th>Outstanding (GHS)</th>
                <th>Account Notes</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', fontWeight: 600 }}>{c.id}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#4A4F53' }}>
                      {c.type === 'COMPANY' ? <Building2 size={13} /> : <UserIcon size={13} />}
                      {c.type}
                    </span>
                  </td>
                  <td style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }}>{c.phone}</td>
                  <td style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{c.jobs}</td>
                  <td style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, color: c.balanceGHS !== '0.00' ? '#B3391B' : '#2E7D4F' }}>
                    {c.balanceGHS}
                  </td>
                  <td style={{ fontSize: '12px', color: '#6B7075' }}>{c.notes}</td>
                  <td>
                    {c.flagged ? (
                      <span className="alert-pill" style={{ gap: '4px' }}>
                        <Flag size={11} /> Review
                      </span>
                    ) : (
                      <span style={{ color: '#2E7D4F', fontSize: '12px', fontWeight: 600 }}>Clear</span>
                    )}
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
