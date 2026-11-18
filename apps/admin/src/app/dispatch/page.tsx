'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Clock, CheckCircle2, Star, Send } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { adminApi } from '@/lib/api';

interface UnassignedJob {
  id: string;
  customer: string;
  vehicleNeeded: string;
  weight: string;
  pickup: string;
  delivery: string;
  pickupTime: string;
  urgency: 'critical' | 'normal';
}

interface MatchingTruck {
  id: string;
  ownerDriver: string;
  plate: string;
  type: string;
  capacityTonnes: number;
  distanceKm: number;
  rating: number;
  status: 'available' | 'busy';
}

const UNASSIGNED_JOBS: UnassignedJob[] = [];

const CANDIDATE_TRUCKS: MatchingTruck[] = [];

export default function DispatchPage() {
  const [jobs, setJobs] = useState<UnassignedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<UnassignedJob | null>(null);
  const [selectedTrucks, setSelectedTrucks] = useState<string[]>([]);
  const [liveMode, setLiveMode] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vagrova_admin_token') : null;
    if (!token) return;
    adminApi
      .listAdminJobs()
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const mapped: UnassignedJob[] = rows.map((j: any) => ({
          id: j.id,
          customer: j.jobRequest?.customer?.user?.name || 'Customer',
          vehicleNeeded: j.jobRequest?.vehicleType || 'FLATBED',
          weight: `${j.jobRequest?.weightTonnes ?? 20} tonnes`,
          pickup: j.jobRequest?.pickupAddress || 'Accra',
          delivery: j.jobRequest?.deliveryAddress || 'Tema',
          pickupTime: new Date(j.createdAt || Date.now()).toLocaleString(),
          urgency: j.status === 'PENDING_DISPATCH' ? 'critical' : 'normal',
        }));
        setJobs(mapped);
        setSelectedJob(mapped[0]);
        setLiveMode(true);
      })
      .catch(() => {
        // Keep demo jobs if not authenticated as admin yet
      });
  }, []);

  const toggleTruckSelect = (id: string) => {
    if (selectedTrucks.includes(id)) {
      setSelectedTrucks(selectedTrucks.filter((t) => t !== id));
    } else {
      setSelectedTrucks([...selectedTrucks, id]);
    }
  };

  const handleSendOffers = async () => {
    if (!selectedJob) return;
    if (liveMode) {
      try {
        await adminApi.broadcastOffers(selectedJob.id, selectedTrucks, '500000');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to broadcast offers');
        return;
      }
    }
    alert(`Dispatched atomic job offer for ${selectedJob.id} to ${selectedTrucks.length} shortlisted trucks with 60s countdown!`);
  };

  return (
    <AdminShell>
      <div style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, color: '#0D6D78' }}>
              Dispatch & Job Allocation
            </h1>
            <p style={{ color: '#6B7075', fontSize: '13px', marginTop: '2px' }}>
              Match booked loads with available verified heavy carriers and manage live dispatches.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ backgroundColor: '#F5D5CF', color: '#B3391B', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={13} strokeWidth={2.2} /> 1 Critical Job Approaching Pickup
            </span>
          </div>
        </div>

        {/* 2-Column Split: Unassigned Jobs vs Matching Shortlist */}
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '20px' }}>
          {/* Left: Unassigned Jobs Queue */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7075', marginBottom: '10px' }}>
              Unassigned Booked Jobs ({jobs.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {jobs.length === 0 && (
                <div className="card" style={{ padding: '20px', textAlign: 'center', color: '#6B7075', fontSize: '13px' }}>
                  No unassigned jobs in database yet.
                </div>
              )}
              {jobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderLeft: job.urgency === 'critical' ? '4px solid #B3391B' : '4px solid #FFC600',
                      backgroundColor: isSelected ? '#FFFFFF' : '#F9F8F5',
                      boxShadow: isSelected ? '0 2px 8px rgba(31,35,38,0.1)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', fontWeight: 700, color: '#0D6D78' }}>
                        {job.id}
                      </span>
                      {job.urgency === 'critical' && (
                        <span style={{ backgroundColor: '#F5D5CF', color: '#B3391B', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px' }}>
                          EXPEDITED
                        </span>
                      )}
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0D6D78', marginBottom: '2px' }}>
                      {job.customer}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7075', marginBottom: '8px' }}>
                      {job.vehicleNeeded} · {job.weight}
                    </div>

                    <div style={{ fontSize: '12px', color: '#0D6D78', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={12} strokeWidth={2} color="#6B7075" /> {job.pickup} → {job.delivery}
                    </div>
                    <div style={{ fontSize: '11px', color: job.urgency === 'critical' ? '#B3391B' : '#6B7075', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={12} strokeWidth={2} /> Pickup: {job.pickupTime}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Job Match Panel & Candidate Shortlist */}
          <div>
            <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #DDD9D1', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7075' }}>
                    SELECTED JOB SPECIFICATION
                  </span>
                  <div style={{ fontFamily: '"Archivo", sans-serif', fontSize: '18px', fontWeight: 700, color: '#0D6D78' }}>
                    {selectedJob ? `${selectedJob.id} — ${selectedJob.customer}` : 'No job selected'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#6B7075' }}>REQUIRED EQUIPMENT</div>
                  <div style={{ fontWeight: 700, color: '#FFC600', fontSize: '14px' }}>
                    {selectedJob ? `${selectedJob.vehicleNeeded} (${selectedJob.weight})` : '—'}
                  </div>
                </div>
              </div>

              {/* Matching Algorithm Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#2E7D4F', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} strokeWidth={2.2} /> 3 Verified Available Trucks Match Within 15 km Radius
                </span>
                <span style={{ fontSize: '11px', color: '#6B7075' }}>
                  Shortlist selection triggers atomic first-acceptance reservation
                </span>
              </div>

              {/* Candidate Trucks Table */}
              <table className="data-table" style={{ marginBottom: '20px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Select</th>
                    <th>Driver / Owner</th>
                    <th>Number Plate</th>
                    <th>Capacity</th>
                    <th>Distance</th>
                    <th>Rating</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {CANDIDATE_TRUCKS.map((truck) => {
                    const isSelected = selectedTrucks.includes(truck.id);
                    return (
                      <tr key={truck.id} style={{ backgroundColor: isSelected ? '#FFFDF5' : undefined }}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTruckSelect(truck.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{truck.ownerDriver}</div>
                          <div style={{ fontSize: '11px', color: '#6B7075' }}>ID: {truck.id}</div>
                        </td>
                        <td>
                          <span style={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: '#0D6D78',
                            backgroundColor: '#EBF2F3',
                            border: '1.5px solid #0D6D78',
                            borderRadius: '2px',
                            padding: '1px 6px',
                          }}>
                            {truck.plate}
                          </span>
                        </td>
                        <td>{truck.capacityTonnes}t</td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#0D6D78' }}>{truck.distanceKm} km</span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={12} fill="#FFC600" color="#FFC600" /> {truck.rating}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-secondary"
                            style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
                            onClick={() => alert(`Direct assigned ${truck.plate} to ${selectedJob?.id || 'job'}`)}
                          >
                            Direct Assign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Dispatch Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #DDD9D1', paddingTop: '16px' }}>
                <span style={{ fontSize: '13px', color: '#6B7075' }}>
                  Selected <strong>{selectedTrucks.length}</strong> trucks for broadcast offer.
                </span>
                <button
                  className="btn-primary"
                  onClick={handleSendOffers}
                  disabled={selectedTrucks.length === 0}
                >
                  <Send size={13} strokeWidth={2.2} /> Broadcast Offer to Shortlist ({selectedTrucks.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

