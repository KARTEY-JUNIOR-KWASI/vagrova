'use client';

import React, { useState, useEffect } from 'react';
import { Camera, PhoneCall, FileCheck2, History, UserCheck } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { adminApi } from '@/lib/api';

const DEMO_QUOTES = [
  {
    id: 'demo-1',
    jobNumber: 'VGJ-004820',
    serviceGroup: 'TRANSPORT',
    bookingStatus: 'SUBMITTED',
    customer: { user: { name: 'Mensah Construction', phone: '+233 24 450 1234' } },
    vehicleType: 'TIPPER',
    weightTonnes: 28,
    pickupAddress: 'Accra',
    deliveryAddress: 'Kumasi',
    description: 'Granite aggregate haulage',
    photoKeys: ['1', '2', '3'],
    createdAt: new Date().toISOString(),
    quotes: [],
    communicationLogs: [],
  },
  {
    id: 'demo-2',
    jobNumber: 'VGJ-004815',
    serviceGroup: 'MACHINERY',
    bookingStatus: 'NEGOTIATING',
    customer: { user: { name: 'Bright Asante', phone: '+233 55 782 9900' } },
    vehicleType: 'LOWBED',
    equipmentType: { name: 'Excavator', pricingModel: 'DAILY' },
    weightTonnes: 22,
    pickupAddress: 'Tarkwa Mining Concession',
    deliveryAddress: 'Tarkwa Mining Concession',
    description: 'Excavator: Site clearing & drainage trenching',
    projectDetail: {
      projectLocation: 'Tarkwa Mining Concession, Western Region',
      expectedDuration: 14,
      durationUnit: 'DAYS',
      operatorRequired: true,
      fuelArrangement: 'COMPANY_SUPPLIED',
    },
    photoKeys: ['1', '2'],
    createdAt: new Date().toISOString(),
    quotes: [],
    communicationLogs: [],
  },
];

const STATUS_STYLES: Record<string, { edge: string; bg: string; text: string }> = {
  SUBMITTED: { edge: '#B3391B', bg: '#F5D5CF', text: '#7C2712' },
  UNDER_REVIEW: { edge: '#43AEC5', bg: '#EBF2F3', text: '#0D6D78' },
  NEGOTIATING: { edge: '#FFC600', bg: '#FFF5D6', text: '#7A5300' },
  QUOTED: { edge: '#FFC600', bg: '#FFF5D6', text: '#7A5300' },
  ACCEPTED: { edge: '#1E825A', bg: '#D4F0E5', text: '#13573C' },
};

export default function QuotationsPage() {
  const [requests, setRequests] = useState<any[]>(DEMO_QUOTES);
  const [selected, setSelected] = useState<any>(DEMO_QUOTES[0]);
  const [liveMode, setLiveMode] = useState(false);

  const [internalNotes, setInternalNotes] = useState('');
  const [commChannel, setCommChannel] = useState('PHONE');
  const [commSummary, setCommSummary] = useState('');

  const [transportGhs, setTransportGhs] = useState('2500');
  const [rentalGhs, setRentalGhs] = useState('4500');
  const [loadingGhs, setLoadingGhs] = useState('400');
  const [mobilisationGhs, setMobilisationGhs] = useState('1200');
  const [operationalGhs, setOperationalGhs] = useState('300');
  const [negotiationNotes, setNegotiationNotes] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState<{ invoiceNumber: string; pdfUrl: string } | null>(null);

  const loadQueue = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vagrova_admin_token') : null;
    if (!token) return;
    adminApi
      .getQuotesQueue()
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) {
          setRequests(rows);
          setSelected(rows[0]);
          setInternalNotes(rows[0].internalNotes || '');
          setLiveMode(true);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadQueue();
    const timer = setInterval(loadQueue, 15000);
    return () => clearInterval(timer);
  }, []);

  const totalGhs =
    (Number(transportGhs) || 0) +
    (Number(rentalGhs) || 0) +
    (Number(loadingGhs) || 0) +
    (Number(mobilisationGhs) || 0) +
    (Number(operationalGhs) || 0);

  const handleAssignMe = async () => {
    if (!liveMode || !selected?.id) {
      alert('Connect Live API in the top bar to assign Booking Officers.');
      return;
    }
    try {
      await adminApi.assignBookingOfficer(selected.id, internalNotes);
      loadQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign');
    }
  };

  const handleLogComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commSummary.trim()) return;
    if (!liveMode) {
      alert('Communication logged locally (connect Live API to save to PostgreSQL).');
      setCommSummary('');
      return;
    }
    try {
      await adminApi.logCommunication(selected.id, commChannel, commSummary.trim());
      setCommSummary('');
      loadQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to log communication');
    }
  };

  const handleRecordRevision = async () => {
    if (!liveMode) {
      alert(`Negotiation revision GHS ${totalGhs.toLocaleString()} recorded (demo mode).`);
      return;
    }
    try {
      await adminApi.recordNegotiationRevision(selected.id, {
        transportChargeMinor: Math.round((Number(transportGhs) || 0) * 100),
        rentalChargeMinor: Math.round((Number(rentalGhs) || 0) * 100),
        loadingChargeMinor: Math.round((Number(loadingGhs) || 0) * 100),
        mobilisationChargeMinor: Math.round((Number(mobilisationGhs) || 0) * 100),
        operationalChargeMinor: Math.round((Number(operationalGhs) || 0) * 100),
        negotiationNotes,
      });
      setNegotiationNotes('');
      loadQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record revision');
    }
  };

  const handleSendOfficialQuote = async () => {
    const totalMinor = String(Math.round(totalGhs * 100));
    const depositMinor = String(Math.round(totalGhs * 30));
    if (!liveMode) {
      alert(`Official Quotation GHS ${totalGhs.toLocaleString()} sent to customer (demo mode).`);
      return;
    }
    try {
      await adminApi.sendOfficialQuote(selected.id, {
        totalMinorUnits: totalMinor,
        depositMinorUnits: depositMinor,
        breakdown: {
          transportGhs,
          rentalGhs,
          loadingGhs,
          mobilisationGhs,
          operationalGhs,
          negotiationNotes,
        },
        validityHours: 48,
      });
      loadQueue();
      alert(`Official Quotation sent for ${selected.jobNumber}.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send quote');
    }
  };

  const activeRevisions = selected?.quotes?.[0]?.revisions || [];

  return (
    <AdminShell>
      <div style={{ maxWidth: '1400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, color: '#0D6D78' }}>
              Booking Requests, Negotiation & Quotations
            </h1>
            <p style={{ color: '#4B6B70', fontSize: '13px', marginTop: '2px' }}>
              Company-controlled review, customer negotiation revisions, and official quotation dispatch.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={loadQueue} className="btn-secondary" style={{ height: '32px', fontSize: '12px' }}>
              Refresh
            </button>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0D6D78', backgroundColor: '#FFFFFF', padding: '6px 12px', borderRadius: '6px', border: '1px solid #CFE0E3' }}>
              {requests.length} Requests · {liveMode ? 'Live PostgreSQL' : 'Demo Preview (Click Connect Live API)'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Column: Booking Queue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {requests.map((q) => {
              const ss = STATUS_STYLES[q.bookingStatus || 'SUBMITTED'] || STATUS_STYLES.SUBMITTED;
              const isSelected = selected?.id === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelected(q);
                    setInternalNotes(q.internalNotes || '');
                  }}
                  className="card"
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderLeft: `4px solid ${ss.edge}`,
                    borderColor: isSelected ? '#0D6D78' : '#CFE0E3',
                    borderWidth: isSelected ? '2px' : '1px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '11px', fontWeight: 700, color: '#4B6B70' }}>
                      {q.jobNumber} · {q.serviceGroup || 'TRANSPORT'}
                    </span>
                    <span style={{ backgroundColor: ss.bg, color: ss.text, fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px' }}>
                      {q.bookingStatus || 'SUBMITTED'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0D6D78' }}>
                    {q.customer?.user?.name || 'Customer'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#4B6B70', marginTop: '3px' }}>
                    {q.equipmentType?.name || q.vehicleType} · {q.pickupAddress} → {q.deliveryAddress}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Review, Negotiation Revisions & Official Quote */}
          {selected && (
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #CFE0E3', paddingBottom: '14px' }}>
                <div>
                  <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', fontWeight: 700, color: '#4B6B70' }}>
                    {selected.jobNumber} · {selected.serviceGroup || 'TRANSPORT'}
                  </div>
                  <h2 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '20px', fontWeight: 800, color: '#0D6D78', marginTop: '2px' }}>
                    {selected.customer?.user?.name} ({selected.customer?.user?.phone})
                  </h2>
                  <div style={{ fontSize: '13px', color: '#4B6B70', marginTop: '4px' }}>
                    {selected.description}
                  </div>
                </div>
                <button
                  onClick={handleAssignMe}
                  className="btn-secondary"
                  style={{ height: '36px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserCheck size={14} />
                  {selected.assignedOfficer ? `Officer: ${selected.assignedOfficer.name}` : 'Assign to Me'}
                </button>
              </div>

              {/* Project / Cargo Details & Internal Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ backgroundColor: '#EBF2F3', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0D6D78', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {selected.serviceGroup === 'MACHINERY' ? 'Machinery Project Specs' : 'Cargo & Route Specs'}
                  </div>
                  {selected.projectDetail ? (
                    <div style={{ fontSize: '12px', color: '#0D6D78', lineHeight: 1.6 }}>
                      <div>Site: <strong>{selected.projectDetail.projectLocation}</strong></div>
                      <div>Duration: <strong>{selected.projectDetail.expectedDuration} {selected.projectDetail.durationUnit}</strong></div>
                      <div>Operator: <strong>{selected.projectDetail.operatorRequired ? 'Included' : 'Customer'}</strong> · Fuel: <strong>{selected.projectDetail.fuelArrangement}</strong></div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#0D6D78', lineHeight: 1.6 }}>
                      <div>Route: <strong>{selected.pickupAddress} → {selected.deliveryAddress}</strong></div>
                      <div>Weight: <strong>{selected.weightTonnes}t</strong> · Photos: <strong>{selected.photoKeys?.length || 0}</strong></div>
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: '#EBF2F3', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0D6D78', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Internal Staff Notes
                  </div>
                  <textarea
                    rows={3}
                    className="input"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Record site verification or internal remarks..."
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Official Communication Log */}
              <div style={{ borderTop: '1px solid #CFE0E3', paddingTop: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0D6D78', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PhoneCall size={14} /> Official Customer Communication Log
                </div>
                <form onSubmit={handleLogComm} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <select className="input" value={commChannel} onChange={(e) => setCommChannel(e.target.value)} style={{ width: '120px', height: '36px', fontSize: '12px' }}>
                    <option value="PHONE">PHONE</option>
                    <option value="WHATSAPP">WHATSAPP</option>
                    <option value="EMAIL">EMAIL</option>
                  </select>
                  <input
                    className="input"
                    value={commSummary}
                    onChange={(e) => setCommSummary(e.target.value)}
                    placeholder="Log negotiation call or customer confirmation..."
                    style={{ flex: 1, height: '36px', fontSize: '12px' }}
                  />
                  <button type="submit" className="btn-secondary" style={{ height: '36px', fontSize: '12px' }}>
                    Log Call
                  </button>
                </form>
                {(selected.communicationLogs || []).slice(0, 3).map((c: any) => (
                  <div key={c.id} style={{ fontSize: '12px', color: '#4B6B70', padding: '4px 0' }}>
                    <strong>[{c.channel}]</strong> {c.summary}
                  </div>
                ))}
              </div>

              {/* Negotiation Price Builder & Revisions */}
              <div style={{ borderTop: '1px solid #CFE0E3', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0D6D78', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History size={14} /> Price Negotiation & Breakdown (GHS)
                  </div>
                  <div style={{ fontFamily: '"Archivo", sans-serif', fontSize: '18px', fontWeight: 800, color: '#0D6D78' }}>
                    Total: GHS {totalGhs.toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '10px' }}>
                  {[
                    { label: 'Transport', val: transportGhs, set: setTransportGhs },
                    { label: 'Rental', val: rentalGhs, set: setRentalGhs },
                    { label: 'Loading', val: loadingGhs, set: setLoadingGhs },
                    { label: 'Mobilisation', val: mobilisationGhs, set: setMobilisationGhs },
                    { label: 'Operational', val: operationalGhs, set: setOperationalGhs },
                  ].map((f) => (
                    <div key={f.label}>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#4B6B70', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {f.label}
                      </label>
                      <input type="number" className="input" value={f.val} onChange={(e) => f.set(e.target.value)} style={{ width: '100%', height: '36px', fontSize: '13px' }} />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    className="input"
                    value={negotiationNotes}
                    onChange={(e) => setNegotiationNotes(e.target.value)}
                    placeholder="Negotiation notes (e.g. Agreed 14-day rate including operator & lowbed)..."
                    style={{ flex: 1, height: '38px', fontSize: '12px' }}
                  />
                  <button onClick={handleRecordRevision} className="btn-secondary" style={{ height: '38px', fontSize: '12px' }}>
                    Save Revision
                  </button>
                  <button onClick={handleSendOfficialQuote} className="btn-primary" style={{ height: '38px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FileCheck2 size={14} /> Send Official Quotation
                  </button>
                  {selected?.quotes?.[0]?.id && (
                    <button
                      onClick={async () => {
                        if (!liveMode) {
                          alert('Connect Live API to generate PDF Pro Forma Invoice.');
                          return;
                        }
                        try {
                          const inv = await adminApi.generateProFormaInvoice(selected.quotes[0].id, negotiationNotes || undefined);
                          setGeneratedInvoice({ invoiceNumber: inv.invoiceNumber, pdfUrl: inv.pdfUrl });
                          loadQueue();
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Failed to generate Pro Forma Invoice');
                        }
                      }}
                      className="btn-secondary"
                      style={{ height: '38px', fontSize: '12px' }}
                    >
                      Generate PDF Pro Forma
                    </button>
                  )}
                </div>

                {generatedInvoice && (
                  <div style={{ backgroundColor: '#D4F0E5', color: '#13573C', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Pro Forma Invoice {generatedInvoice.invoiceNumber} issued & saved!</span>
                    <span>PDF Ready ({generatedInvoice.pdfUrl})</span>
                  </div>
                )}

                {activeRevisions.length > 0 && (
                  <div style={{ backgroundColor: '#EBF2F3', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0D6D78', marginBottom: '4px' }}>
                      Revision History ({activeRevisions.length})
                    </div>
                    {activeRevisions.map((rev: any) => (
                      <div key={rev.id} style={{ fontSize: '12px', color: '#4B6B70', display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>v{rev.version} · {rev.negotiationNotes || 'Price revision'}</span>
                        <strong>GHS {(Number(rev.proposedTotalMinor) / 100).toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
