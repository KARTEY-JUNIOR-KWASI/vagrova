/**
 * Vagrova Driver App — Home & Shift Screen
 *
 * - Prominent Available / Busy / Offline toggle
 * - Active vehicle indicator with plate number in frame
 * - Live GPS transmitting indicator when Available
 * - Urgent incoming job offer alert with countdown
 * - Today's earnings and trip count
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

type AvailabilityState = 'available' | 'busy' | 'offline';

export default function DriverHomeScreen() {
  const [availability, setAvailability] = useState<AvailabilityState>('available');
  const [activeTruckPlate] = useState('GW-2290-22');
  const [activeTruckType] = useState('Flatbed (40t)');

  // Mock incoming offer
  const [hasIncomingOffer] = useState(true);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.wordmark}>
            VAG<Text style={{ color: colors.safetyAmber }}>ROVA</Text>
          </Text>
          <Text style={styles.headerSub}>Driver Operations · Yaw Boateng</Text>
        </View>

        {/* Assigned truck badge */}
        <View style={styles.truckBadge}>
          <Text style={styles.truckBadgeLabel}>ACTIVE TRUCK</Text>
          <View style={styles.plateBorder}>
            <Text style={styles.plateText}>{activeTruckPlate}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* AVAILABILITY STATUS SWITCH */}
        <View style={styles.statusControlCard}>
          <Text style={styles.sectionTitle}>DISPATCH AVAILABILITY</Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                availability === 'available' && styles.toggleBtnAvailable,
              ]}
              onPress={() => setAvailability('available')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.statusLight,
                  {
                    backgroundColor:
                      availability === 'available' ? colors.weighbridgeGreen : colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.toggleText,
                  availability === 'available' && styles.toggleTextActive,
                ]}
              >
                AVAILABLE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                availability === 'busy' && styles.toggleBtnBusy,
              ]}
              onPress={() => setAvailability('busy')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.statusLight,
                  {
                    backgroundColor:
                      availability === 'busy' ? colors.safetyAmber : colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.toggleText,
                  availability === 'busy' && styles.toggleTextActive,
                ]}
              >
                BUSY
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                availability === 'offline' && styles.toggleBtnOffline,
              ]}
              onPress={() => setAvailability('offline')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.statusLight,
                  {
                    backgroundColor:
                      availability === 'offline' ? colors.rustRed : colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.toggleText,
                  availability === 'offline' && styles.toggleTextActive,
                ]}
              >
                OFFLINE
              </Text>
            </TouchableOpacity>
          </View>

          {/* Location indicator note */}
          <View style={styles.gpsNoteRow}>
            <View
              style={[
                styles.gpsDot,
                {
                  backgroundColor:
                    availability === 'available'
                      ? colors.weighbridgeGreen
                      : colors.textMuted,
                },
              ]}
            />
            <Text style={styles.gpsNoteText}>
              {availability === 'available'
                ? 'Sharing high-precision GPS with Vagrova Dispatch'
                : 'GPS tracking is paused'}
            </Text>
          </View>
        </View>

        {/* INCOMING JOB OFFER BANNER */}
        {hasIncomingOffer && availability === 'available' && (
          <TouchableOpacity
            style={styles.offerBanner}
            onPress={() => router.push('/trip/offer')}
            activeOpacity={0.9}
          >
            <View style={styles.offerBannerHeader}>
              <View style={styles.offerTag}>
                <Text style={styles.offerTagText}>NEW OFFER AVAILABLE</Text>
              </View>
              <View style={[styles.countdownBadge, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <Feather name="clock" size={12} color={colors.safetyAmber} />
                <Text style={styles.countdownText}>00:42</Text>
              </View>
            </View>

            <Text style={styles.offerTitle}>Tema Port → Spintex Industrial</Text>
            <Text style={styles.offerDetails}>
              Flatbed 40t · Steel Girders (18t) · 28.5 km
            </Text>

            <View style={styles.payoutHighlightRow}>
              <View>
                <Text style={styles.payoutLabel}>NET EARNINGS</Text>
                <Text style={styles.payoutAmount}>GHS 5,480.00</Text>
              </View>
              <View style={styles.viewOfferBtn}>
                <Text style={styles.viewOfferBtnText}>REVIEW OFFER →</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* ACTIVE RUNNING TRIP SHORTCUT */}
        <TouchableOpacity
          style={styles.activeTripCard}
          onPress={() => router.push('/trip/active')}
          activeOpacity={0.85}
        >
          <View style={styles.activeTripHeader}>
            <Text style={styles.activeTripId}>VGJ-004819</Text>
            <View style={styles.tripStatusTag}>
              <Text style={styles.tripStatusTagText}>HEADING TO PICKUP</Text>
            </View>
          </View>
          <Text style={styles.activeTripRoute}>Kasoa → Accra Industrial Area</Text>
          <Text style={styles.activeTripNextAction}>
            Next step: Arrive at Golden Gate, Kasoa
          </Text>
        </TouchableOpacity>

        {/* TODAY'S SHIFT METRICS */}
        <Text style={styles.sectionHeaderLabel}>TODAY'S SHIFT</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>COMPLETED JOBS</Text>
            <Text style={styles.metricVal}>2</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>NET EARNINGS</Text>
            <Text style={[styles.metricVal, { color: colors.safetyAmber }]}>
              GHS 3,920
            </Text>
          </View>
        </View>

        {/* QUICK VEHICLE COMPLIANCE / EXPIRY LINK */}
        <TouchableOpacity
          style={styles.complianceCard}
          onPress={() => router.push('/vehicle/docs')}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.complianceTitle}>Vehicle Documents & Roadworthy</Text>
            <Text style={styles.complianceSub}>
              All 5 documents verified · Insurance expires in 22 days
            </Text>
          </View>
          <Text style={{ fontSize: 18, color: colors.safetyAmber }}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  header: {
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
  wordmark: {
    fontFamily: 'Archivo-Bold',
    fontSize: 24,
    color: colors.textHighContrast,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  truckBadge: { alignItems: 'flex-end' },
  truckBadgeLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 9,
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: 2,
  },
  plateBorder: {
    borderWidth: 2,
    borderColor: colors.textHighContrast,
    backgroundColor: '#000000',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  plateText: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 13,
    color: colors.textHighContrast,
    letterSpacing: 1.2,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingBottom: spacing[8] },

  // Availability control
  statusControlCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radii.card,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: spacing[3],
  },
  toggleRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[3] },
  toggleBtn: {
    flex: 1,
    height: 50,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleBtnAvailable: {
    borderColor: colors.weighbridgeGreen,
    backgroundColor: '#1C3325',
  },
  toggleBtnBusy: {
    borderColor: colors.safetyAmber,
    backgroundColor: '#382B0A',
  },
  toggleBtnOffline: {
    borderColor: colors.rustRed,
    backgroundColor: '#351610',
  },
  statusLight: { width: 8, height: 8, borderRadius: 4 },
  toggleText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  toggleTextActive: { color: colors.textHighContrast },

  gpsNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gpsDot: { width: 6, height: 6, borderRadius: 3 },
  gpsNoteText: { fontFamily: 'IBMPlexSans-Regular', fontSize: 11, color: colors.textMuted },

  // Incoming offer banner
  offerBanner: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 2,
    borderColor: colors.safetyAmber,
    borderRadius: radii.card,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  offerBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  offerTag: {
    backgroundColor: colors.safetyAmber,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  offerTagText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 10,
    color: colors.bgDark,
    letterSpacing: 0.5,
  },
  countdownBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  countdownText: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 13,
    color: colors.safetyAmber,
  },
  offerTitle: {
    fontFamily: 'Archivo-Bold',
    fontSize: 18,
    color: colors.textHighContrast,
    marginBottom: 2,
  },
  offerDetails: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing[3],
  },
  payoutHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing[3],
  },
  payoutLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  payoutAmount: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 18,
    color: colors.safetyAmber,
  },
  viewOfferBtn: {
    backgroundColor: colors.safetyAmber,
    paddingHorizontal: spacing[3],
    paddingVertical: 8,
    borderRadius: radii.button,
  },
  viewOfferBtnText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 12,
    color: colors.bgDark,
  },

  // Active running trip
  activeTripCard: {
    backgroundColor: colors.surfaceDark,
    borderLeftWidth: 4,
    borderLeftColor: colors.weighbridgeGreen,
    borderRadius: radii.card,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  activeTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeTripId: {
    fontFamily: 'IBMPlexMono-Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  tripStatusTag: {
    backgroundColor: '#1C3325',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tripStatusTagText: {
    fontFamily: 'IBMPlexSans-Bold',
    fontSize: 9,
    color: colors.weighbridgeGreen,
    letterSpacing: 0.5,
  },
  activeTripRoute: {
    fontFamily: 'Archivo-Bold',
    fontSize: 16,
    color: colors.textHighContrast,
    marginBottom: 4,
  },
  activeTripNextAction: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 13,
    color: colors.safetyAmber,
  },

  // Metrics
  sectionHeaderLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: spacing[2],
  },
  metricsGrid: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[4] },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderRadius: radii.card,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  metricLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metricVal: {
    fontFamily: 'Archivo-Bold',
    fontSize: 22,
    color: colors.textHighContrast,
  },

  complianceCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radii.card,
    padding: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  complianceTitle: {
    fontFamily: 'Archivo-Bold',
    fontSize: 14,
    color: colors.textHighContrast,
    marginBottom: 2,
  },
  complianceSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});

