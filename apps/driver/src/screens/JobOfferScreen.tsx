/**
 * Vagrova Driver App — Job Offer Review Screen
 *
 * - Live countdown timer (auto-expires if not accepted in time)
 * - Exact pickup & delivery locations with estimated route distance
 * - Cargo type, weight (tonnes), required equipment
 * - Cargo photos gallery (pre-trip evaluation)
 * - Net Provider Payout breakdown (Gross - Vagrova commission)
 * - Atomic one-tap Accept or Decline with reason selection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

const DECLINE_REASONS = [
  'Truck currently loaded / committed',
  'Distance to pickup is too far',
  'Weight exceeds safe axle rating',
  'Mechanical maintenance / downtime',
  'Price insufficient for road terrain',
];

export default function JobOfferScreen() {
  const [timeLeft, setTimeLeft] = useState(42);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      router.push('/');
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAccept = () => {
    // In production, performs atomic server-side accept
    router.push({
      pathname: '/trip/active',
      params: { jobId: 'VGJ-004825', stage: 'heading_to_pickup' },
    });
  };

  const handleDeclineReason = (reason: string) => {
    setShowDeclineModal(false);
    router.push('/');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      {/* Top Bar with urgent countdown */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.offerLabel}>INCOMING HAULAGE OFFER</Text>
          <Text style={styles.jobId}>VGJ-004825</Text>
        </View>

        <View style={styles.timerBadge}>
          <Text style={styles.timerNumber}>{timeLeft}s</Text>
          <Text style={styles.timerSub}>remaining</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Payout highlight */}
        <View style={styles.payoutCard}>
          <Text style={styles.payoutTitle}>YOUR NET PAYOUT</Text>
          <Text style={styles.payoutMainAmount}>GHS 5,480.00</Text>
          <Text style={styles.payoutBreakdown}>
            Gross Job Price: GHS 6,450.00 · Vagrova Comm. (15%): GHS 970.00
          </Text>
        </View>

        {/* Route Details */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>ROUTE (28.5 KM)</Text>

          {/* Pickup */}
          <View style={styles.waypointRow}>
            <View style={[styles.marker, { backgroundColor: colors.safetyAmber }]}>
              <Text style={[styles.markerText, { color: colors.bgDark }]}>A</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pointLabel}>PICKUP (EST. 6 KM FROM YOU)</Text>
              <Text style={styles.pointAddress}>Tema Port, Golden Jubilee Terminal 2</Text>
              <Text style={styles.pointLandmark}>Opposite Gate 4 security desk</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          {/* Delivery */}
          <View style={styles.waypointRow}>
            <View style={[styles.marker, { backgroundColor: colors.textHighContrast }]}>
              <Text style={[styles.markerText, { color: colors.bgDark }]}>B</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pointLabel}>DELIVERY POINT</Text>
              <Text style={styles.pointAddress}>Spintex Road, Heavy Industrial Zone</Text>
              <Text style={styles.pointLandmark}>Near Kasapreko depot, blue gate</Text>
            </View>
          </View>
        </View>

        {/* Cargo Specification */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>CARGO DETAILS</Text>

          <View style={styles.specGrid}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>LOAD TYPE</Text>
              <Text style={styles.specValue}>Structural Steel Beams</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>WEIGHT</Text>
              <Text style={styles.specValueBold}>18.0 Tonnes</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>DIMENSIONS</Text>
              <Text style={styles.specValue}>12.0m Length (Standard)</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>LOGISTICS</Text>
              <Text style={styles.specValue}>Crane loading on site</Text>
            </View>
          </View>
        </View>

        {/* Cargo Photos */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>CUSTOMER PHOTOS (3)</Text>
          <View style={styles.photosRow}>
            <View style={styles.photoBox}>
              <Text style={{ fontSize: 24 }}>🏗️</Text>
              <Text style={styles.photoBoxLabel}>Beams</Text>
            </View>
            <View style={styles.photoBox}>
              <Text style={{ fontSize: 24 }}>🚛</Text>
              <Text style={styles.photoBoxLabel}>Access</Text>
            </View>
            <View style={styles.photoBox}>
              <Text style={{ fontSize: 24 }}>📦</Text>
              <Text style={styles.photoBoxLabel}>Tie-downs</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.declineBtn}
          onPress={() => setShowDeclineModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.declineBtnText}>DECLINE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={handleAccept}
          activeOpacity={0.9}
        >
          <Text style={styles.acceptBtnText}>ACCEPT JOB NOW →</Text>
        </TouchableOpacity>
      </View>

      {/* Decline Reasons Modal */}
      {showDeclineModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Reason for Declining</Text>
            <Text style={styles.modalSub}>
              Helps dispatch match jobs better with your truck.
            </Text>

            {DECLINE_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={styles.reasonOption}
                onPress={() => handleDeclineReason(reason)}
              >
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowDeclineModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  topBar: {
    backgroundColor: colors.surfaceDark,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  offerLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.safetyAmber,
  },
  jobId: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 18,
    color: colors.textHighContrast,
  },
  timerBadge: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.safetyAmber,
    borderRadius: radii.button,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  timerNumber: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 18,
    color: colors.safetyAmber,
  },
  timerSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 9,
    color: colors.textMuted,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingBottom: 100 },

  payoutCard: {
    backgroundColor: '#382B0A',
    borderWidth: 1,
    borderColor: colors.safetyAmber,
    borderRadius: radii.card,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  payoutTitle: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.safetyAmber,
    marginBottom: 4,
  },
  payoutMainAmount: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 28,
    color: colors.textHighContrast,
    marginBottom: 4,
  },
  payoutBreakdown: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },

  card: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radii.card,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardSectionLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: spacing[3],
  },

  waypointRow: { flexDirection: 'row', gap: spacing[3] },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: { fontFamily: 'IBMPlexMono-Bold', fontSize: 12 },
  pointLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  pointAddress: {
    fontFamily: 'Archivo-Bold',
    fontSize: 14,
    color: colors.textHighContrast,
    marginTop: 2,
  },
  pointLandmark: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.borderSubtle,
    marginLeft: 11,
    marginVertical: 4,
  },

  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  specItem: { width: '47%' },
  specLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  specValue: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 13,
    color: colors.textHighContrast,
    marginTop: 2,
  },
  specValueBold: {
    fontFamily: 'Archivo-Bold',
    fontSize: 14,
    color: colors.safetyAmber,
    marginTop: 2,
  },

  photosRow: { flexDirection: 'row', gap: spacing[3] },
  photoBox: {
    flex: 1,
    height: 70,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  photoBoxLabel: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    padding: spacing[3],
    flexDirection: 'row',
    gap: spacing[3],
  },
  declineBtn: {
    width: '30%',
    height: 56,
    borderWidth: 1,
    borderColor: colors.rustRed,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#351610',
  },
  declineBtnText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 13,
    color: colors.rustRed,
    letterSpacing: 0.5,
  },
  acceptBtn: {
    flex: 1,
    height: 56,
    backgroundColor: colors.safetyAmber,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 15,
    color: colors.bgDark,
    letterSpacing: 0.5,
  },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surfaceDark,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  modalHeading: {
    fontFamily: 'Archivo-Bold',
    fontSize: 17,
    color: colors.textHighContrast,
    marginBottom: 4,
  },
  modalSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing[3],
  },
  reasonOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  reasonText: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 14,
    color: colors.textHighContrast,
  },
  modalCancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing[2],
  },
  modalCancelText: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 14,
    color: colors.textMuted,
  },
});

