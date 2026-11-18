'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { adminApi } from '@/lib/api';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMobileBlocked, setIsMobileBlocked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [phone, setPhone] = useState('+233302000000');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsConnected(Boolean(localStorage.getItem('vagrova_admin_token')));
      const checkViewport = () => {
        const isSmallScreen = window.innerWidth < 1024;
        const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        setIsMobileBlocked(isSmallScreen || isMobileUA);
      };
      checkViewport();
      window.addEventListener('resize', checkViewport);
      return () => window.removeEventListener('resize', checkViewport);
    }
  }, []);

  if (isMobileBlocked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0D6D78',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '420px',
            backgroundColor: '#FFFFFF',
            color: '#0D6D78',
            borderRadius: '16px',
            padding: '28px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: '#4B6B70', textTransform: 'uppercase', marginBottom: '8px' }}>
            Desktop / Laptop Required
          </div>
          <h1 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>
            Vagrova Operations Console
          </h1>
          <p style={{ fontSize: '14px', color: '#4B6B70', lineHeight: 1.55 }}>
            For security and operational control, the Company Admin Dashboard & Database is strictly restricted to laptop and desktop computers (minimum 1024px screen width).
          </p>
        </div>
      </div>
    );
  }

  const handleRequestOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await adminApi.requestOtp(phone.trim());
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await adminApi.verifyOtp(phone.trim(), otp.trim());
      const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'OPERATIONS_MANAGER', 'FINANCE', 'AGENT'];
      if (!STAFF_ROLES.includes(res.user?.role)) {
        setError(`Account role is ${res.user?.role || 'CUSTOMER'}. Sign in with your Admin phone number.`);
        return;
      }
      localStorage.setItem('vagrova_admin_token', res.accessToken);
      setIsConnected(true);
      setShowAuthModal(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('vagrova_admin_token');
    setIsConnected(false);
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div
          style={{
            height: '52px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #CFE0E3',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <input
            className="input"
            placeholder="Search jobs, customers, trucks…"
            style={{ width: '280px' }}
          />
          <div style={{ flex: 1 }} />

          {isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  backgroundColor: '#D4F0E5',
                  color: '#13573C',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '4px',
                  letterSpacing: '0.03em',
                }}
              >
                LIVE API CONNECTED
              </span>
              <button
                onClick={handleSignOut}
                style={{
                  backgroundColor: '#EBF2F3',
                  color: '#0D6D78',
                  border: '1px solid #CFE0E3',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                backgroundColor: '#0D6D78',
                color: '#FFC600',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Connect Live API
            </button>
          )}
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#EBF2F3' }}>
          {children}
        </div>
      </div>

      {/* Admin OTP Login Modal */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(13, 109, 120, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #CFE0E3',
              boxShadow: '0 20px 50px rgba(8, 77, 85, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontFamily: '"Archivo", sans-serif', fontSize: '18px', fontWeight: 700, color: '#0D6D78' }}>
                Admin Live Sign-In
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{ background: 'none', border: 'none', color: '#4B6B70', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#4B6B70', marginBottom: '16px', lineHeight: 1.45 }}>
              Sign in with your seeded Admin phone (<code>+233302000000</code>) to load live PostgreSQL verification queues and dispatch jobs.
            </p>

            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4B6B70', textTransform: 'uppercase', marginBottom: '6px' }}>
              Admin Phone
            </label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', marginBottom: '12px' }}
            />

            {otpSent && (
              <>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4B6B70', textTransform: 'uppercase', marginBottom: '6px' }}>
                  6-Digit SMS Code
                </label>
                <input
                  className="input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  style={{ width: '100%', marginBottom: '12px', letterSpacing: '0.2em', fontWeight: 700 }}
                />
              </>
            )}

            {error && (
              <div style={{ backgroundColor: '#FADBD8', color: '#C0392B', fontSize: '12px', fontWeight: 600, padding: '8px 10px', borderRadius: '4px', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            {!otpSent ? (
              <button
                disabled={loading}
                onClick={handleRequestOtp}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#FFC600',
                  color: '#0D6D78',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={handleVerifyOtp}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#0D6D78',
                  color: '#FFC600',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Connect'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
