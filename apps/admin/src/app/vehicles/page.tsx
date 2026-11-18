'use client';

import React, { useState, useEffect } from 'react';
import { Truck, AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { AdminShell } from '@/components/AdminShell';
import { adminApi } from '@/lib/api';

const VEHICLES: Array<{
  plate: string;
  type: string;
  makeModel: string;
  capacity: string;
  owner: string;
  status: string;
  roadworthyExp: string;
  insuranceExp: string;
  jobs: number;
}> = [];

export default function VehiclesPage() {
  const [filter, setFilter] = useState('ALL');
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newPricingModel, setNewPricingModel] = useState('DAILY');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vagrova_admin_token') : null;
    if (!token) return;
    adminApi
      .getEquipmentAdminAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          setSelectedCategoryId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleActive = async (typeId: string, currentActive: boolean) => {
    try {
      const updated = await adminApi.updateEquipmentType(typeId, { isActive: !currentActive });
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          equipmentTypes: cat.equipmentTypes.map((t: any) => (t.id === typeId ? updated : t)),
        })),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Connect Live API to edit equipment');
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !selectedCategoryId) return;
    try {
      const created = await adminApi.createEquipmentType({
        categoryId: selectedCategoryId,
        code: newName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
        name: newName.trim(),
        pricingModel: newPricingModel,
      });
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategoryId
            ? { ...cat, equipmentTypes: [...cat.equipmentTypes, created] }
            : cat,
        ),
      );
      setNewName('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add equipment type');
    }
  };

  const filtered = VEHICLES.filter((v) => filter === 'ALL' || v.status === filter);

  return (
    <AdminShell>
      <div style={{ maxWidth: '1400px' }}>
        {categories.length > 0 && (
          <div className="card" style={{ padding: '18px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '18px', fontWeight: 700, color: '#0D6D78' }}>
                  Configurable Service Categories & Equipment Catalog
                </h2>
                <p style={{ color: '#4B6B70', fontSize: '12px', marginTop: '2px' }}>
                  Add, activate, or deactivate Category A (Transport) and Category B (Construction & Mining Machinery).
                </p>
              </div>
              <form onSubmit={handleAddEquipment} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  className="input"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  style={{ height: '34px', fontSize: '12px' }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="New equipment name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ height: '34px', width: '170px', fontSize: '12px' }}
                />
                <select
                  className="input"
                  value={newPricingModel}
                  onChange={(e) => setNewPricingModel(e.target.value)}
                  style={{ height: '34px', fontSize: '12px' }}
                >
                  <option value="PER_KM">PER_KM</option>
                  <option value="HOURLY">HOURLY</option>
                  <option value="DAILY">DAILY</option>
                  <option value="WEEKLY">WEEKLY</option>
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="PROJECT_CONTRACT">PROJECT_CONTRACT</option>
                </select>
                <button type="submit" className="btn-primary" style={{ height: '34px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={14} /> Add
                </button>
              </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {categories.map((cat) => (
                <div key={cat.id} style={{ backgroundColor: '#EBF2F3', borderRadius: '8px', padding: '12px', border: '1px solid #CFE0E3' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0D6D78', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {cat.name} ({cat.equipmentTypes.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {cat.equipmentTypes.map((eq: any) => (
                      <button
                        key={eq.id}
                        onClick={() => handleToggleActive(eq.id, eq.isActive)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CFE0E3',
                          backgroundColor: eq.isActive ? '#FFFFFF' : '#FADBD8',
                          color: eq.isActive ? '#0D6D78' : '#87241B',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        title={`Pricing: ${eq.pricingModel}${eq.isProvisional ? ' (Provisional)' : ''} — Click to toggle active`}
                      >
                        {eq.name} · <span style={{ opacity: 0.7 }}>{eq.pricingModel}</span>
                        {eq.isProvisional ? ' (Provisional)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '24px', fontWeight: 700, color: '#0D6D78' }}>
              Vehicle Fleet Database
            </h1>
            <p style={{ color: '#6B7075', fontSize: '13px', marginTop: '2px' }}>
              All registered heavy trucks, capacities, owners, and compliance expiry dates.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['ALL', 'AVAILABLE', 'BUSY', 'BLOCKED_EXPIRED_DOCS'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={filter === status ? 'btn-primary' : 'btn-secondary'}
                style={{ height: '34px', fontSize: '12px' }}
              >
                {status === 'BLOCKED_EXPIRED_DOCS' ? 'Blocked (Expired)' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Plate</th>
                <th>Type</th>
                <th>Make / Model</th>
                <th>Capacity</th>
                <th>Owner</th>
                <th>Roadworthy Exp.</th>
                <th>Insurance Exp.</th>
                <th>Jobs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const isBlocked = v.status === 'BLOCKED_EXPIRED_DOCS';
                const isAvailable = v.status === 'AVAILABLE';
                return (
                  <tr key={v.plate}>
                    <td>
                      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', backgroundColor: '#EBF2F3', border: '1.5px solid #0D6D78', borderRadius: '2px', padding: '2px 6px' }}>
                        {v.plate}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{v.type}</td>
                    <td>{v.makeModel}</td>
                    <td style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }}>{v.capacity}</td>
                    <td>{v.owner}</td>
                    <td style={{ color: isBlocked ? '#B3391B' : '#0D6D78', fontWeight: isBlocked ? 700 : 400 }}>{v.roadworthyExp}</td>
                    <td>{v.insuranceExp}</td>
                    <td style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{v.jobs}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderLeft: `3px solid ${isBlocked ? '#B3391B' : isAvailable ? '#2E7D4F' : '#FFC600'}`,
                          backgroundColor: isBlocked ? '#F5D5CF' : isAvailable ? '#D4EEE0' : '#FFF5D6',
                          color: isBlocked ? '#7C2712' : isAvailable ? '#1C5235' : '#7A5300',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '0 3px 3px 0',
                        }}
                      >
                        {isBlocked ? <AlertTriangle size={11} /> : isAvailable ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {v.status.replace(/_/g, ' ')}
                      </span>
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
