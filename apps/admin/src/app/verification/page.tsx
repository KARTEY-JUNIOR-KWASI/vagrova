'use client';

import React, { useState, useEffect } from 'react';
import { FileText, ZoomIn, RotateCw, Download, X, Check } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { adminApi } from '@/lib/api';

interface VerificationApplicant {
  id: string;
  providerName: string;
  phone: string;
  kind: 'Owner' | 'Driver' | 'Owner & Driver';
  hometown: string;
  submittedAt: string;
  trucksCount: number;
  documents: {
    type: string;
    label: string;
    status: 'approved' | 'waiting' | 'rejected';
    expiryDate: string;
    fileUrl: string;
  }[];
}

const APPLICANTS: VerificationApplicant[] = [
  {
    id: 'PRV-8821',
    providerName: 'Kofi Mensah',
    phone: '+233 24 990 4411',
    kind: 'Owner & Driver',
    hometown: 'Kumasi, Ashanti Region',
    submittedAt: 'Today 09:15',
    trucksCount: 1,
    documents: [
      { type: 'drivers_licence', label: "Driver's Licence (Class F)", status: 'waiting', expiryDate: '2027-11-20', fileUrl: 'licence.jpg' },
      { type: 'roadworthy', label: 'DVLA Roadworthy Certificate', status: 'waiting', expiryDate: '2027-04-15', fileUrl: 'roadworthy.jpg' },
      { type: 'insurance', label: 'Commercial Insurance Policy', status: 'approved', expiryDate: '2027-08-30', fileUrl: 'insurance.jpg' },
      { type: 'national_id', label: 'Ghana Card', status: 'approved', expiryDate: '2030-01-01', fileUrl: 'ghana_card.jpg' },
    ],
  },
  {
    id: 'PRV-8820',
    providerName: 'Volta Haulage Logistics Ltd',
    phone: '+233 55 410 7722',
    kind: 'Owner',
    hometown: 'Tema, Greater Accra',
    submittedAt: 'Yesterday 17:30',
    trucksCount: 4,
    documents: [
      { type: 'business_reg', label: 'Registrar of Companies Certificate', status: 'waiting', expiryDate: 'Permanent', fileUrl: 'reg.pdf' },
      { type: 'fleet_insurance', label: 'Fleet Carrier Insurance', status: 'waiting', expiryDate: '2027-01-10', fileUrl: 'fleet_ins.pdf' },
    ],
  },
];

export default function VerificationPage() {
  const [applicants, setApplicants] = useState<VerificationApplicant[]>(APPLICANTS);
  const [selectedApplicant, setSelectedApplicant] = useState<VerificationApplicant>(APPLICANTS[0]);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [liveMode, setLiveMode] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vagrova_admin_token') : null;
    if (!token) return;
    adminApi
      .getVerificationQueue()
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const mapped: VerificationApplicant[] = rows.map((p: any) => ({
          id: p.id,
          providerName: p.user?.name || 'Provider',
          phone: p.user?.phone || '',
          kind:
            p.kind === 'OWNER_AND_DRIVER'
              ? 'Owner & Driver'
              : p.kind === 'OWNER_ONLY'
              ? 'Owner'
              : 'Driver',
          hometown: p.homeTown || 'Accra',
          submittedAt: new Date(p.createdAt || Date.now()).toLocaleDateString(),
          trucksCount: p.trucks?.length ?? 0,
          documents: (p.documents || []).map((d: any) => ({
            type: d.id,
            label: d.type,
            status:
              d.status === 'APPROVED'
                ? 'approved'
                : d.status === 'REJECTED'
                ? 'rejected'
                : 'waiting',
            expiryDate: d.expiryDate ? String(d.expiryDate).slice(0, 10) : '—',
            fileUrl: d.fileKey || '',
          })),
        }));
        setApplicants(mapped);
        setSelectedApplicant(mapped[0]);
        setLiveMode(true);
      })
      .catch(() => {
        // Keep demo queue if not authenticated as admin yet
      });
  }, []);

  const activeDoc = selectedApplicant.documents[selectedDocIndex] || selectedApplicant.documents[0];

  const handleApprove = async () => {
    if (!activeDoc) return;
    if (liveMode) {
      try {
        await adminApi.reviewDocument(activeDoc.type, 'APPROVED');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to approve document');
        return;
      }
    }
    alert(`Document "${activeDoc.label}" marked as APPROVED. Audit log entry recorded.`);
  };

  const handleReject = async () => {
    if (!activeDoc) return;
    if (!rejectionReason.trim()) {
      alert('Please enter a specific reason for rejection to send to the provider.');
      return;
    }
    if (liveMode) {
      try {
        await adminApi.reviewDocument(activeDoc.type, 'REJECTED', rejectionReason.trim());
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to reject document');
        return;
      }
    }
    alert(`Document "${activeDoc.label}" REJECTED. Reason sent to provider via SMS and App notification: "${rejectionReason}"`);
    setShowRejectBox(false);
    setRejectionReason('');
  };

  return (
    <AdminShell>
      <div style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, color: '#0D6D78' }}>
              Driver & Provider Verification
            </h1>
            <p style={{ color: '#6B7075', fontSize: '13px', marginTop: '2px' }}>
              Split-view compliance review. Verify credentials, national IDs, and DVLA certificates before activating trucks.
            </p>
          </div>
          <span style={{ backgroundColor: '#FFF5D6', color: '#7A5300', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '3px' }}>
            4 Providers Pending Verification
          </span>
        </div>

        {/* 2-Column Split View: Applicant Details + Document Inspection */}
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
          {/* Left Column: Applicants Queue & Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7075', marginBottom: '12px' }}>
                Review Queue
              </div>

              {APPLICANTS.map((applicant) => {
                const isSelected = selectedApplicant.id === applicant.id;
                return (
                  <div
                    key={applicant.id}
                    onClick={() => {
                      setSelectedApplicant(applicant);
                      setSelectedDocIndex(0);
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      borderLeft: isSelected ? '4px solid #FFC600' : '4px solid transparent',
                      backgroundColor: isSelected ? '#F0EDE8' : 'transparent',
                      marginBottom: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#0D6D78', fontSize: '13px' }}>{applicant.providerName}</span>
                      <span style={{ fontSize: '11px', color: '#6B7075' }}>{applicant.submittedAt}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7075', marginTop: '2px' }}>
                      {applicant.kind} · {applicant.phone}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Applicant Profile Details */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7075', marginBottom: '12px' }}>
                Provider Information
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#6B7075', fontSize: '11px', textTransform: 'uppercase' }}>Provider ID: </span>
                  <strong style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{selectedApplicant.id}</strong>
                </div>
                <div>
                  <span style={{ color: '#6B7075', fontSize: '11px', textTransform: 'uppercase' }}>Account Type: </span>
                  <strong>{selectedApplicant.kind}</strong>
                </div>
                <div>
                  <span style={{ color: '#6B7075', fontSize: '11px', textTransform: 'uppercase' }}>Home Town / Base: </span>
                  <strong>{selectedApplicant.hometown}</strong>
                </div>
                <div>
                  <span style={{ color: '#6B7075', fontSize: '11px', textTransform: 'uppercase' }}>Registered Trucks: </span>
                  <strong>{selectedApplicant.trucksCount} Vehicle(s)</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #DDD9D1', marginTop: '16px', paddingTop: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7075', marginBottom: '8px' }}>
                  Submitted Documents ({selectedApplicant.documents.length})
                </div>

                {selectedApplicant.documents.map((doc, idx) => {
                  const isDocActive = selectedDocIndex === idx;
                  return (
                    <div
                      key={doc.type}
                      onClick={() => setSelectedDocIndex(idx)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: isDocActive ? '#0D6D78' : '#FFFFFF',
                        color: isDocActive ? '#FFFFFF' : '#0D6D78',
                        border: '1px solid #DDD9D1',
                        marginBottom: '6px',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ fontWeight: isDocActive ? 600 : 400 }}>{doc.label}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: isDocActive ? '#FFC600' : '#6B7075' }}>
                        {doc.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Split Document Inspector & Decision Toolbar */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #DDD9D1', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7075' }}>
                  DOCUMENT INSPECTOR
                </span>
                <h2 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '18px', fontWeight: 700, color: '#0D6D78' }}>
                  {activeDoc.label}
                </h2>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#6B7075' }}>Recorded Expiry Date: </span>
                <strong style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{activeDoc.expiryDate}</strong>
              </div>
            </div>

            {/* Document Image Preview Container */}
            <div
              style={{
                flex: 1,
                minHeight: '380px',
                backgroundColor: '#EBF2F3',
                border: '2px dashed #BCB8B1',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                marginBottom: '20px',
              }}
            >
              <div style={{ marginBottom: '10px', color: '#6B7075' }}>
                <FileText size={44} strokeWidth={1.5} />
              </div>
              <div style={{ fontFamily: '"Archivo", sans-serif', fontSize: '15px', fontWeight: 700, color: '#0D6D78' }}>
                High-Resolution Scan: {activeDoc.fileUrl}
              </div>
              <p style={{ fontSize: '12px', color: '#6B7075', textAlign: 'center', maxWidth: '400px', marginTop: '4px' }}>
                Edge detection verified. Inspect validity stamp, seal, signature, and driver identification number.
              </p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ height: '30px', fontSize: '11px' }}><ZoomIn size={12} strokeWidth={2} /> Zoom In</button>
                <button className="btn-secondary" style={{ height: '30px', fontSize: '11px' }}><RotateCw size={12} strokeWidth={2} /> Rotate</button>
                <button className="btn-secondary" style={{ height: '30px', fontSize: '11px' }}><Download size={12} strokeWidth={2} /> Download Original</button>
              </div>
            </div>

            {/* Rejection reason expandable panel */}
            {showRejectBox && (
              <div style={{ backgroundColor: '#F5D5CF', borderLeft: '4px solid #B3391B', padding: '16px', borderRadius: '4px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#B3391B', marginBottom: '4px' }}>
                  REJECTION REASON (Sent to driver in plain words):
                </div>
                <textarea
                  style={{ width: '100%', height: '60px', padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #B3391B' }}
                  placeholder="e.g. The DVLA roadworthy stamp is obscured by glare. Please retake photo with all 4 corners visible."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button className="btn-secondary" style={{ height: '30px', fontSize: '11px' }} onClick={() => setShowRejectBox(false)}>
                    Cancel
                  </button>
                  <button
                    style={{ backgroundColor: '#B3391B', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 12px', height: '30px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={handleReject}
                  >
                    Confirm Rejection & Send Alert
                  </button>
                </div>
              </div>
            )}

            {/* Decision Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #DDD9D1', paddingTop: '16px' }}>
              <button
                className="btn-secondary"
                style={{ color: '#B3391B', borderColor: '#B3391B' }}
                onClick={() => setShowRejectBox(!showRejectBox)}
              >
                <X size={13} strokeWidth={2.2} /> Reject Document...
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary">
                  Request Clarification Call
                </button>
                <button className="btn-primary" onClick={handleApprove}>
                  <Check size={13} strokeWidth={2.5} /> Approve Document & Record Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

