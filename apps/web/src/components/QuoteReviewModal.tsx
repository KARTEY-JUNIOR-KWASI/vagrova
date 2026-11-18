'use client';

import React, { useState } from 'react';
import { colors } from '@vagrova/ui';
import { CheckCircle2, CreditCard, ShieldCheck, Smartphone, X } from 'lucide-react';
import { vagrovaApi } from '@/lib/api';

interface QuoteReviewModalProps {
  requestItem: any | null;
  authToken: string | null;
  defaultPhone?: string;
  onClose: () => void;
  onSuccess: (title: string, message: string) => void;
  onError: (title: string, message: string) => void;
}

function fmtPesewas(minor?: string | number | null): string {
  const ghs = Number(minor || 0) / 100;
  return `GHS ${ghs.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function QuoteReviewModal({
  requestItem,
  authToken,
  defaultPhone = '',
  onClose,
  onSuccess,
  onError,
}: QuoteReviewModalProps) {
  const [busy, setBusy] = useState(false);
  const [acceptedJob, setAcceptedJob] = useState<{
    id: string;
    jobNumber: string;
    depositDueMinorUnits: string;
  } | null>(null);
  const [method, setMethod] = useState<'MOMO' | 'BANK_TRANSFER'>('MOMO');
  const [momoProvider, setMomoProvider] = useState<'MTN' | 'TELECEL'>('MTN');
  const [momoPhone, setMomoPhone] = useState(defaultPhone);

  if (!requestItem) return null;

  const quote = requestItem.quotes?.[0];
  const existingJob = acceptedJob || requestItem.job;
  const isQuoteAccepted = Boolean(existingJob) || quote?.status === 'ACCEPTED';

  const handleAcceptQuote = async () => {
    if (!authToken || !quote?.id) return;
    setBusy(true);
    try {
      const res = await vagrovaApi.respondToQuote(authToken, quote.id, 'ACCEPT');
      if (res.job) {
        setAcceptedJob({
          id: res.job.id,
          jobNumber: res.job.jobNumber,
          depositDueMinorUnits: res.job.depositDueMinorUnits,
        });
      }
      onSuccess('Quote Accepted', `Job ${requestItem.jobNumber} is booked! Pay deposit to dispatch.`);
    } catch (err: any) {
      onError('Unable to Accept Quote', err?.message || 'Failed to accept quote.');
    } finally {
      setBusy(false);
    }
  };

  const handlePayDeposit = async () => {
    const targetJobId = existingJob?.id;
    if (!authToken || !targetJobId) {
      onError('Booking Required', 'Accept the quote first before paying the deposit.');
      return;
    }
    if (method === 'MOMO' && !momoPhone.trim()) {
      onError('Phone Required', 'Enter your Mobile Money phone number.');
      return;
    }
    setBusy(true);
    try {
      const res = await vagrovaApi.initializeDeposit(authToken, {
        jobId: targetJobId,
        method,
        ...(method === 'MOMO' ? { momoProvider, momoPhoneNumber: momoPhone.trim() } : {}),
        idempotencyKey: `dep-${targetJobId}-${Date.now()}`,
      });
      onSuccess(
        'Deposit Initiated',
        res?.message || `Payment prompt sent for Job ${requestItem.jobNumber}.`,
      );
      onClose();
    } catch (err: any) {
      onError('Payment Error', err?.message || 'Failed to initialize deposit payment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 115,
        backgroundColor: 'rgba(8, 30, 35, 0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-fade-up"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: colors.roadWhite,
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
          padding: '18px 18px 28px',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: colors.gravelGrey }}>
              {requestItem.jobNumber} · OFFICIAL QUOTATION
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '19px', fontWeight: 800, color: colors.asphalt }}>
              {requestItem.equipmentType?.name || requestItem.vehicleType}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close quote review"
            style={{ background: colors.waybillPaper, border: `1px solid ${colors.grey200}`, borderRadius: '999px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color={colors.asphalt} />
          </button>
        </div>

        <div style={{ fontSize: '12px', color: colors.gravelGrey, marginBottom: '14px' }}>
          {requestItem.pickupAddress} → {requestItem.deliveryAddress}
        </div>

        {!quote ? (
          <div style={{ backgroundColor: colors.waybillPaper, border: `1px solid ${colors.grey200}`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: colors.asphalt, marginBottom: '4px' }}>Quote Under Review</div>
            <div style={{ fontSize: '12px', color: colors.gravelGrey }}>
              Our Booking Officer is finalizing your official quotation. You&apos;ll receive an alert as soon as it&apos;s ready.
            </div>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: colors.waybillPaper, border: `1.5px solid ${colors.asphalt}`, borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: colors.gravelGrey }}>Total Contract Value</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: colors.asphalt }}>
                  {fmtPesewas(quote.totalMinorUnits)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '8px', borderTop: `1px dashed ${colors.grey300}` }}>
                <span style={{ fontWeight: 700, color: colors.asphalt }}>Booking Deposit Due</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '16px', color: colors.asphalt }}>
                  {fmtPesewas(existingJob?.depositDueMinorUnits || quote.depositMinorUnits)}
                </span>
              </div>
            </div>

            {!isQuoteAccepted ? (
              <button
                disabled={busy}
                onClick={handleAcceptQuote}
                style={{
                  width: '100%',
                  height: '50px',
                  borderRadius: '10px',
                  backgroundColor: colors.safetyAmber,
                  color: colors.asphalt,
                  border: 'none',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={18} />
                <span>{busy ? 'Confirming...' : 'Accept Official Quote & Proceed to Pay'}</span>
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: colors.asphalt, textTransform: 'uppercase' }}>
                  Select Deposit Payment Method
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => setMethod('MOMO')}
                    style={{
                      height: '44px',
                      borderRadius: '8px',
                      border: method === 'MOMO' ? `2px solid ${colors.asphalt}` : `1px solid ${colors.grey200}`,
                      backgroundColor: method === 'MOMO' ? colors.waybillPaper : colors.roadWhite,
                      fontWeight: 700,
                      fontSize: '13px',
                      color: colors.asphalt,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Smartphone size={15} /> Mobile Money
                  </button>
                  <button
                    onClick={() => setMethod('BANK_TRANSFER')}
                    style={{
                      height: '44px',
                      borderRadius: '8px',
                      border: method === 'BANK_TRANSFER' ? `2px solid ${colors.asphalt}` : `1px solid ${colors.grey200}`,
                      backgroundColor: method === 'BANK_TRANSFER' ? colors.waybillPaper : colors.roadWhite,
                      fontWeight: 700,
                      fontSize: '13px',
                      color: colors.asphalt,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <CreditCard size={15} /> Bank Transfer
                  </button>
                </div>

                {method === 'MOMO' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
                    <select
                      value={momoProvider}
                      onChange={(e) => setMomoProvider(e.target.value as any)}
                      style={{ height: '44px', borderRadius: '8px', border: `1px solid ${colors.grey300}`, padding: '0 8px', fontWeight: 700 }}
                    >
                      <option value="MTN">MTN MoMo</option>
                      <option value="TELECEL">Telecel</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="024 000 0000"
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      style={{ height: '44px', borderRadius: '8px', border: `1px solid ${colors.grey300}`, padding: '0 12px' }}
                    />
                  </div>
                )}

                <button
                  disabled={busy}
                  onClick={handlePayDeposit}
                  style={{
                    width: '100%',
                    height: '52px',
                    borderRadius: '10px',
                    backgroundColor: colors.asphalt,
                    color: colors.safetyAmber,
                    border: 'none',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '15px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>{busy ? 'Processing...' : `Pay Deposit (${fmtPesewas(existingJob?.depositDueMinorUnits || quote.depositMinorUnits)})`}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
