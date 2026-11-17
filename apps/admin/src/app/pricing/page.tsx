'use client';

import React, { useState } from 'react';
import { Save, History } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';

const INITIAL_RULES = [
  { vehicleType: 'Tipper', baseRateGHS: 1200, perKmGHS: 30, perTonneGHS: 35, minChargeGHS: 1200, commissionPct: 15, version: 3, effectiveFrom: '01 Nov 2026' },
  { vehicleType: 'Flatbed', baseRateGHS: 1800, perKmGHS: 35, perTonneGHS: 40, minChargeGHS: 1800, commissionPct: 15, version: 4, effectiveFrom: '01 Nov 2026' },
  { vehicleType: 'Lowbed', baseRateGHS: 2800, perKmGHS: 50, perTonneGHS: 55, minChargeGHS: 2800, commissionPct: 15, version: 2, effectiveFrom: '15 Oct 2026' },
  { vehicleType: 'Container Carrier', baseRateGHS: 1500, perKmGHS: 32, perTonneGHS: 30, minChargeGHS: 1500, commissionPct: 15, version: 3, effectiveFrom: '01 Nov 2026' },
  { vehicleType: 'Tanker', baseRateGHS: 2000, perKmGHS: 38, perTonneGHS: 40, minChargeGHS: 2000, commissionPct: 15, version: 1, effectiveFrom: '01 Oct 2026' },
  { vehicleType: 'Crane Truck', baseRateGHS: 2500, perKmGHS: 45, perTonneGHS: 50, minChargeGHS: 2500, commissionPct: 15, version: 2, effectiveFrom: '15 Oct 2026' },
  { vehicleType: 'Tow / Recovery', baseRateGHS: 900, perKmGHS: 25, perTonneGHS: 20, minChargeGHS: 900, commissionPct: 15, version: 2, effectiveFrom: '01 Nov 2026' },
  { vehicleType: 'Refrigerated', baseRateGHS: 1600, perKmGHS: 36, perTonneGHS: 35, minChargeGHS: 1600, commissionPct: 15, version: 1, effectiveFrom: '01 Oct 2026' },
];

export default function PricingPage() {
  const [rules, setRules] = useState(INITIAL_RULES);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleCommissionChange = (idx: number, value: string) => {
    const next = [...rules];
    next[idx] = { ...next[idx], commissionPct: Number(value) || 0 };
    setRules(next);
  };

  const handlePublishVersion = (vehicleType: string) => {
    setSavedNotice(`New versioned rate rule published for ${vehicleType} and recorded in Audit Log.`);
  };

  return (
    <AdminShell>
      <div style={{ maxWidth: '1400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, color: '#0D6D78' }}>
              Pricing & Commission Rules
            </h1>
            <p style={{ color: '#6B7075', fontSize: '13px', marginTop: '2px' }}>
              Versioned base rates, per-km, per-tonne, and commission rules in GHS. Every change is dated and audited.
            </p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7075', fontWeight: 600 }}>
            <History size={14} /> Versioned Rate Engine Active
          </span>
        </div>

        {savedNotice && (
          <div style={{ backgroundColor: '#D4EEE0', borderLeft: '4px solid #2E7D4F', color: '#1C5235', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
            {savedNotice}
          </div>
        )}

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle Type</th>
                <th>Base Rate (GHS)</th>
                <th>Per km (GHS)</th>
                <th>Per Tonne (GHS)</th>
                <th>Minimum (GHS)</th>
                <th>Commission %</th>
                <th>Version</th>
                <th>Effective From</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r, idx) => (
                <tr key={r.vehicleType}>
                  <td style={{ fontWeight: 600 }}>{r.vehicleType}</td>
                  <td style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{r.baseRateGHS.toLocaleString()}</td>
                  <td style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{r.perKmGHS}</td>
                  <td style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{r.perTonneGHS}</td>
                  <td style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{r.minChargeGHS.toLocaleString()}</td>
                  <td>
                    <input
                      type="number"
                      className="input"
                      value={r.commissionPct}
                      onChange={(e) => handleCommissionChange(idx, e.target.value)}
                      style={{ width: '70px', height: '30px', fontFamily: '"IBM Plex Mono", monospace' }}
                    />
                  </td>
                  <td style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }}>v{r.version}</td>
                  <td style={{ fontSize: '12px', color: '#6B7075' }}>{r.effectiveFrom}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ height: '30px', fontSize: '11px' }}
                      onClick={() => handlePublishVersion(r.vehicleType)}
                    >
                      <Save size={12} /> Publish
                    </button>
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
