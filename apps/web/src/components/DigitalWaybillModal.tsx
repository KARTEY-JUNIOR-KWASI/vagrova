'use client';

import React, { useEffect, useState } from 'react';
import { colors, PlateNumber } from '@vagrova/ui';
import { FileCheck2, Printer, X } from 'lucide-react';
import { vagrovaApi } from '@/lib/api';

interface DigitalWaybillModalProps {
  jobId: string | null;
  authToken: string | null;
  onClose: () => void;
}

export default function DigitalWaybillModal({ jobId, authToken, onClose }: DigitalWaybillModalProps) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || !authToken) return;
    setLoading(true);
    setError(null);
    vagrovaApi
      .getConsignmentReceipt(authToken, jobId)
      .then((res) => setData(res))
      .catch((err) => setError(err?.message || 'Unable to load digital waybill.'))
      .finally(() => setLoading(false));
  }, [jobId, authToken]);

  if (!jobId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 118,
        backgroundColor: 'rgba(8, 30, 35, 0.58)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-fade-up"
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: colors.roadWhite,
          borderRadius: '14px',
          border: `1.5px solid ${colors.asphalt}`,
          padding: '18px',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck2 size={18} color={colors.asphalt} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 800, color: colors.asphalt }}>
              Digital Waybill &amp; Receipt
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close waybill"
            style={{ background: colors.waybillPaper, border: `1px solid ${colors.grey200}`, borderRadius: '999px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={15} color={colors.asphalt} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: colors.gravelGrey }}>
            Loading official consignment note...
          </div>
        ) : error ? (
          <div style={{ padding: '14px', backgroundColor: colors.redLight, color: colors.rustRed, borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
            {error}
          </div>
        ) : data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.waybillPaper, padding: '10px 12px', borderRadius: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: colors.asphalt }}>
                {data.jobNumber || jobId}
              </span>
              <span style={{ backgroundColor: colors.safetyAmber, color: colors.asphalt, fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '999px' }}>
                {data.stamp || 'BOOKED'}
              </span>
            </div>

            <div style={{ border: `1px solid ${colors.grey200}`, borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Customer:</strong> {data.customer?.name || 'Client'}</div>
              <div><strong>Pickup:</strong> {data.route?.pickupAddress || '—'}</div>
              <div><strong>Delivery:</strong> {data.route?.deliveryAddress || '—'}</div>
              <div><strong>Cargo:</strong> {data.cargo?.description || data.cargo?.category || 'Commercial Haulage'}</div>
              {data.driver?.name && <div><strong>Driver:</strong> {data.driver.name}</div>}
              {data.truck?.plate && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <strong>Truck Plate:</strong>
                  <PlateNumber plate={data.truck.plate} size="sm" />
                </div>
              )}
            </div>

            {data.financials && (
              <div style={{ backgroundColor: colors.asphalt, color: colors.roadWhite, borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Value</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>
                    GHS {(Number(data.financials.totalMinorUnits || 0) / 100).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.safetyAmber }}>
                  <span>Paid to Date</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>
                    GHS {(Number(data.financials.paidMinorUnits || 0) / 100).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            )}

            <button
              onClick={() => typeof window !== 'undefined' && window.print()}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                backgroundColor: colors.safetyAmber,
                color: colors.asphalt,
                border: 'none',
                fontWeight: 800,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Printer size={15} /> Print / Save PDF Waybill
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
