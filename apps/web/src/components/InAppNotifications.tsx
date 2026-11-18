'use client';

import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { colors } from '@vagrova/ui';

export interface AppNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  time: string;
  read: boolean;
}

interface ToastBannerProps {
  toast: AppNotificationItem | null;
  onDismiss: () => void;
}

export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  if (!toast) return null;

  const palette =
    toast.type === 'error'
      ? { bg: '#FFF5F5', border: colors.rustRed, iconColor: colors.rustRed, Icon: AlertTriangle }
      : toast.type === 'warning'
      ? { bg: '#FFFBEB', border: colors.safetyAmber, iconColor: '#9A6B00', Icon: AlertTriangle }
      : toast.type === 'success'
      ? { bg: '#F0FDF4', border: colors.weighbridgeGreen, iconColor: colors.weighbridgeGreen, Icon: CheckCircle2 }
      : { bg: colors.roadWhite, border: colors.asphalt, iconColor: colors.asphalt, Icon: Info };

  const Icon = palette.Icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="anim-fade-up"
      style={{
        position: 'fixed',
        top: '14px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 28px)',
        maxWidth: '420px',
        zIndex: 120,
        backgroundColor: palette.bg,
        border: `1.5px solid ${palette.border}`,
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: '0 12px 30px rgba(8, 77, 85, 0.22)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
      }}
    >
      <Icon size={18} color={palette.iconColor} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: colors.asphalt }}>{toast.title}</div>
        <div style={{ fontSize: '12px', color: colors.gravelGrey, marginTop: '2px', lineHeight: 1.4 }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Close notification"
        style={{ background: 'none', border: 'none', color: colors.gravelGrey, cursor: 'pointer', padding: '2px', flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export function NotificationBellButton({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      aria-label={`Notifications (${unreadCount} unread)`}
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '4px',
        border: `1px solid ${colors.grey200}`,
        backgroundColor: colors.waybillPaper,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <Bell size={15} color={colors.asphalt} />
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            minWidth: '16px',
            height: '16px',
            borderRadius: '999px',
            backgroundColor: colors.safetyAmber,
            color: colors.asphalt,
            fontSize: '10px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '1.5px solid #FFFFFF',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

interface NotificationDrawerProps {
  open: boolean;
  items: AppNotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

export function NotificationDrawer({ open, items, onClose, onMarkAllRead }: NotificationDrawerProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        backgroundColor: 'rgba(8, 30, 35, 0.42)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '56px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-fade-up"
        style={{
          width: 'calc(100% - 24px)',
          maxWidth: '420px',
          maxHeight: '70vh',
          backgroundColor: colors.roadWhite,
          borderRadius: '14px',
          border: `1px solid ${colors.grey200}`,
          boxShadow: '0 18px 40px rgba(8, 77, 85, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.grey200}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, color: colors.asphalt }}>
            Notifications
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {items.some((i) => !i.read) && (
              <button
                onClick={onMarkAllRead}
                style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: 700, color: colors.asphalt, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notifications"
              style={{ background: 'none', border: 'none', color: colors.gravelGrey, cursor: 'pointer', padding: '2px' }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '13px', color: colors.gravelGrey }}>
              No notifications yet. Live dispatch, quote, and trip alerts will appear here.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: item.read ? colors.roadWhite : colors.waybillPaper,
                  border: `1px solid ${item.read ? colors.grey200 : colors.asphalt}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: colors.asphalt }}>{item.title}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: colors.gravelGrey }}>{item.time}</span>
                </div>
                <div style={{ fontSize: '12px', color: colors.gravelGrey, lineHeight: 1.4 }}>{item.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
