'use client';

import React, { useState } from 'react';
import { PhoneCall, Clock, Play, X, Radio } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';

interface CallBackItem {
  id: string;
  callerPhone: string;
  customerName?: string;
  waitingMinutes: number;
  voiceNoteUrl?: string;
  status: 'pending' | 'in_call' | 'resolved';
}

const INITIAL_CALL_BACKS: CallBackItem[] = [
  { id: 'CB-101', callerPhone: '+233 24 551 8890', customerName: 'Kwesi Appiah (Contractor)', waitingMinutes: 4, voiceNoteUrl: 'audio_1.mp3', status: 'pending' },
  { id: 'CB-102', callerPhone: '+233 55 901 2233', customerName: 'Unknown Caller', waitingMinutes: 12, status: 'pending' },
  { id: 'CB-103', callerPhone: '+233 20 776 1144', customerName: 'Akua Agro Trading', waitingMinutes: 18, voiceNoteUrl: 'audio_2.mp3', status: 'pending' },
];

export default function CallCenterPage() {
  const [callBacks, setCallBacks] = useState<CallBackItem[]>(INITIAL_CALL_BACKS);
  const [searchPhone, setSearchPhone] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);

  // Book on behalf form state
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [vehicleType, setVehicleType] = useState('tipper');
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');

  const handleStartCall = (id: string) => {
    setCallBacks(
      callBacks.map((c) => (c.id === id ? { ...c, status: 'in_call' } : c))
    );
  };

  const handleOpenBookForCaller = (phone: string, name?: string) => {
    setCustomerPhone(phone);
    setCustomerName(name || '');
    setShowBookModal(true);
  };

  return (
    <AdminShell>
      <div style={{ maxWidth: '1300px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, color: '#0D6D78' }}>
              Call Center Desk
            </h1>
            <p style={{ color: '#6B7075', fontSize: '13px', marginTop: '2px' }}>
              Book on behalf of callers, play voice notes, and manage call-back requests.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowBookModal(true)}>
            + Book Job on Behalf of Caller
          </button>
        </div>

        {/* Quick Caller Lookup */}
        <div className="card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7075', letterSpacing: '0.06em' }}>
            Caller Lookup:
          </span>
          <input
            className="input"
            style={{ width: '300px' }}
            placeholder="Enter phone number (e.g. 0244...)"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
          />
          <button className="btn-secondary">Search History</button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '12px', color: '#2E7D4F', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={14} strokeWidth={2.2} /> PBX Connected · 2 Agents Online
          </span>
        </div>

        {/* Call Back Queue */}
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7075' }}>
            Call-Back Queue ({callBacks.length} Waiting)
          </div>
          <span style={{ fontSize: '12px', color: '#B3391B', fontWeight: 600 }}>
            Target response time: &lt; 5 minutes
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {callBacks.map((cb) => (
            <div
              key={cb.id}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr auto',
                alignItems: 'center',
                padding: '16px',
                borderLeft: cb.waitingMinutes > 5 ? '4px solid #B3391B' : '4px solid #FFC600',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', fontWeight: 700, color: '#0D6D78' }}>
                    {cb.callerPhone}
                  </span>
                  {cb.waitingMinutes > 5 && (
                    <span style={{ backgroundColor: '#F5D5CF', color: '#B3391B', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px' }}>
                      OVERDUE ({cb.waitingMinutes}m)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7075' }}>
                  {cb.customerName || 'New / Unregistered Caller'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7075', textTransform: 'uppercase' }}>
                  Voice Note
                </div>
                {cb.voiceNoteUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <button className="btn-secondary" style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}>
                      <Play size={11} strokeWidth={2.2} /> Play (0:24)
                    </button>
                    <span style={{ fontSize: '11px', color: '#6B7075' }}>Recorded via App</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', color: '#BCB8B1' }}>No recording attached</span>
                )}
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7075', textTransform: 'uppercase' }}>
                  Status
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginTop: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: cb.status === 'in_call' ? '#FFC600' : '#0D6D78',
                    textTransform: 'uppercase',
                  }}
                >
                  {cb.status === 'in_call' ? (
                    <><PhoneCall size={12} strokeWidth={2.2} /> Dialing...</>
                  ) : (
                    <><Clock size={12} strokeWidth={2.2} /> Waiting</>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-primary"
                  style={{ height: '32px', fontSize: '12px' }}
                  onClick={() => handleStartCall(cb.id)}
                >
                  Call Now
                </button>
                <button
                  className="btn-secondary"
                  style={{ height: '32px', fontSize: '12px' }}
                  onClick={() => handleOpenBookForCaller(cb.callerPhone, cb.customerName)}
                >
                  Book on Behalf
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* BOOK ON BEHALF MODAL */}
        {showBookModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(31, 35, 38, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 300,
            }}
          >
            <div
              className="card"
              style={{
                width: '560px',
                padding: '24px',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '18px', fontWeight: 700 }}>
                  Book Job on Behalf of Customer
                </h2>
                <button
                  onClick={() => setShowBookModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7075', display: 'flex', alignItems: 'center' }}
                  aria-label="Close modal"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#6B7075', marginBottom: '16px' }}>
                Quote and live tracking links will be automatically dispatched via SMS & WhatsApp to the caller upon submission.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7075', textTransform: 'uppercase' }}>
                    Customer Phone Number *
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%', marginTop: '4px' }}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0244123456"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7075', textTransform: 'uppercase' }}>
                    Customer / Business Name
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%', marginTop: '4px' }}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Mensah Construction / Kwesi Appiah"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7075', textTransform: 'uppercase' }}>
                    Vehicle Category *
                  </label>
                  <select
                    className="input"
                    style={{ width: '100%', marginTop: '4px' }}
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    <option value="tipper">Tipper (Sand, Gravel, Aggregate)</option>
                    <option value="flatbed">Flatbed (Steel, Timber, General Cargo)</option>
                    <option value="lowbed">Lowbed (Excavators, Heavy Plant)</option>
                    <option value="container_carrier">Container Carrier (Shipping 20/40ft)</option>
                    <option value="tanker">Tanker (Fuel, Water, Edible)</option>
                    <option value="crane_truck">Crane Truck (Site Lifting)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7075', textTransform: 'uppercase' }}>
                    Pickup Location & Landmark *
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%', marginTop: '4px' }}
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="e.g. Tema Port, Golden Jubilee Gate 2"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7075', textTransform: 'uppercase' }}>
                    Delivery Destination *
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%', marginTop: '4px' }}
                    value={delivery}
                    onChange={(e) => setDelivery(e.target.value)}
                    placeholder="e.g. Spintex Industrial, Kasapreko depot"
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowBookModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    alert('Job created and sent to Quotation queue! Customer notified via SMS.');
                    setShowBookModal(false);
                  }}
                >
                  Create & Send to Quote Queue →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

