/**
 * Vagrova Customer App — Live Tracking & Delivery Screen
 *
 * - Live truck position on map with route line
 * - Plain language status line: "Driver is 12 km from pickup"
 * - Weak data resilience: displays "Last known location: 2 mins ago"
 * - Driver name, verified badge, truck plate in stamped frame, direct call button
 * - Delivery verification code display (given to driver upon arrival)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

export default function TrackingScreen() {
  const params = useLocalSearchParams();
  const jobId = (params.jobId as string) || 'VGJ-004819';

  const [driverName] = useState('Yaw Boateng');
  const [driverPhone] = useState('024 881 2290');
  const [truckPlate] = useState('GW-2290-22');
  const [truckModel] = useState('MAN TGS 33.400 (Flatbed 40t)');
  const [deliveryCode] = useState('7428'); // 4-digit code customer gives driver

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.asphalt} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backBtn}>
          <Text style={styles.backArrow}>← Jobs</Text>
        </TouchableOpacity>
        <Text style={styles.jobIdText}>{jobId}</Text>
      </View>

      {/* Map simulation container */}
      <View style={styles.mapContainer}>
        {/* Simulated Map View with route & truck marker */}
        <View style={styles.mapGridLines}>
          <View style={styles.simulatedRouteLine} />
          {/* Truck Amber Marker */}
          <View style={styles.truckPin}>
            <Text style={{ fontSize: 18 }}>🚛</Text>
          </View>
          {/* Pickup Pin */}
          <View style={[styles.endpointPin, { top: 40, left: 50 }]}>
            <Text style={styles.endpointPinText}>A</Text>
          </View>
          {/* Delivery Pin */}
          <View style={[styles.endpointPin, { bottom: 40, right: 60, backgroundColor: colors.safetyAmber }]}>
            <Text style={[styles.endpointPinText, { color: colors.asphalt }]}>B</Text>
          </View>
        </View>

        {/* Live Network & Weak Data Banner */}
        <View style={styles.networkStatusPill}>
          <View style={styles.liveDot} />
          <Text style={styles.networkStatusText}>Live GPS · Updated 20s ago</Text>
        </View>
      </View>

      {/* Bottom Sheet Details */}
      <ScrollView style={styles.bottomSheet} contentContainerStyle={styles.bottomSheetContent}>
        {/* Plain Language Status Line */}
        <View style={styles.statusBox}>
          <Text style={styles.statusPrimaryLine}>Driver is 12 km from pickup</Text>
          <Text style={styles.statusEtaLine}>Estimated arrival at site in 28 minutes</Text>
        </View>

        {/* Driver & Vehicle Information */}
        <View style={styles.driverCard}>
          <View style={styles.driverInfoRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>YB</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.driverName}>{driverName}</Text>
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedTagText}>VERIFIED</Text>
                </View>
              </View>
              <Text style={styles.truckModelText}>{truckModel}</Text>
            </View>
            <TouchableOpacity
              style={styles.callDriverBtn}
              onPress={() => Linking.openURL(`tel:${driverPhone}`)}
              accessibilityLabel="Call Driver"
            >
              <Text style={styles.callDriverIcon}>📞</Text>
            </TouchableOpacity>
          </View>

          {/* Stamped Number Plate */}
          <View style={styles.plateContainer}>
            <Text style={styles.plateLabel}>VEHICLE PLATE</Text>
            <View style={styles.plateFrame}>
              <Text style={styles.plateText}>{truckPlate}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Confirmation Code */}
        <View style={styles.codeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.codeLabel}>DELIVERY CONFIRMATION CODE</Text>
            <Text style={styles.codeInstruction}>
              Give this 4-digit code to the driver only after cargo is safely offloaded and inspected.
            </Text>
          </View>
          <View style={styles.codeBox}>
            <Text style={styles.codeDigits}>{deliveryCode}</Text>
          </View>
        </View>

        {/* Report Problem Action */}
        <TouchableOpacity style={styles.reportBtn} onPress={() => Linking.openURL('tel:+233302000000')}>
          <Text style={styles.reportBtnText}>⚠️ Report a Delay or Problem to Dispatch</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.waybillPaper },
  topBar: {
    backgroundColor: colors.asphalt,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: spacing[4],
  },
  backBtn: { height: touchTargets.min, justifyContent: 'center' },
  backArrow: { fontFamily: 'IBMPlexSans-Medium', fontSize: 14, color: colors.waybillPaper },
  jobIdText: { fontFamily: 'IBMPlexMono-Bold', fontSize: 13, color: colors.safetyAmber, letterSpacing: 0.5 },

  // Simulated map
  mapContainer: {
    height: 240,
    backgroundColor: '#E5E0D5',
    position: 'relative',
    overflow: 'hidden',
  },
  mapGridLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulatedRouteLine: {
    position: 'absolute',
    width: '75%',
    height: 4,
    backgroundColor: colors.asphalt,
    transform: [{ rotate: '-25deg' }],
  },
  truckPin: {
    position: 'absolute',
    top: 90,
    left: 140,
    backgroundColor: colors.safetyAmber,
    padding: 6,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.asphalt,
  },
  endpointPin: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.asphalt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endpointPinText: { color: colors.roadWhite, fontFamily: 'IBMPlexMono-Bold', fontSize: 11 },

  networkStatusPill: {
    position: 'absolute',
    top: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(31, 35, 38, 0.85)',
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.weighbridgeGreen },
  networkStatusText: { fontFamily: 'IBMPlexSans-Regular', fontSize: 11, color: colors.roadWhite },

  // Bottom sheet
  bottomSheet: { flex: 1, backgroundColor: colors.waybillPaper },
  bottomSheetContent: { padding: spacing[4], paddingBottom: spacing[6] },

  statusBox: {
    backgroundColor: colors.roadWhite,
    borderLeftWidth: 4,
    borderLeftColor: colors.safetyAmber,
    borderRadius: radii.card,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.grey200,
  },
  statusPrimaryLine: { fontFamily: 'Archivo-Bold', fontSize: 17, color: colors.asphalt, marginBottom: 2 },
  statusEtaLine: { fontFamily: 'IBMPlexSans-Regular', fontSize: 13, color: colors.gravelGrey },

  driverCard: {
    backgroundColor: colors.roadWhite,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.card,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  driverInfoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[3] },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.asphalt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverAvatarText: { fontFamily: 'Archivo-Bold', color: colors.safetyAmber, fontSize: 16 },
  driverName: { fontFamily: 'Archivo-Bold', fontSize: 16, color: colors.asphalt },
  verifiedTag: {
    backgroundColor: colors.greenLight,
    borderLeftWidth: 2,
    borderLeftColor: colors.weighbridgeGreen,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  verifiedTagText: { fontFamily: 'IBMPlexSans-Bold', fontSize: 9, color: '#1C5235', letterSpacing: 0.5 },
  truckModelText: { fontFamily: 'IBMPlexSans-Regular', fontSize: 12, color: colors.gravelGrey, marginTop: 2 },

  callDriverBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.grey100,
    borderWidth: 1,
    borderColor: colors.grey200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callDriverIcon: { fontSize: 20 },

  plateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.grey100,
    paddingTop: spacing[3],
  },
  plateLabel: { fontFamily: 'IBMPlexSans-SemiBold', fontSize: 10, color: colors.gravelGrey, letterSpacing: 0.5 },
  plateFrame: {
    borderWidth: 2,
    borderColor: colors.asphalt,
    backgroundColor: colors.waybillPaper,
    borderRadius: 3,
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
  },
  plateText: { fontFamily: 'IBMPlexMono-Bold', fontSize: 14, color: colors.asphalt, letterSpacing: 1.5 },

  // Confirmation code
  codeCard: {
    backgroundColor: colors.asphalt,
    borderRadius: radii.card,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  codeLabel: { fontFamily: 'IBMPlexSans-SemiBold', fontSize: 10, color: colors.safetyAmber, letterSpacing: 0.8 },
  codeInstruction: { fontFamily: 'IBMPlexSans-Regular', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  codeBox: {
    backgroundColor: colors.safetyAmber,
    paddingHorizontal: spacing[3],
    paddingVertical: 8,
    borderRadius: radii.button,
  },
  codeDigits: { fontFamily: 'IBMPlexMono-Bold', fontSize: 22, color: colors.asphalt, letterSpacing: 2 },

  reportBtn: {
    padding: spacing[3],
    alignItems: 'center',
  },
  reportBtnText: {
    fontFamily: 'IBMPlexSans-Medium',
    fontSize: 13,
    color: colors.rustRed,
  },
});

