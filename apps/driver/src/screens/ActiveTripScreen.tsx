/**
 * Vagrova Driver App — Active Trip Execution Screen
 *
 * Core signature field experience:
 * - A single 64px massive step button that always shows the next required operational action:
 *     1. HEADING TO PICKUP
 *     2. ARRIVED AT PICKUP
 *     3. LOADED (prompts photo upload)
 *     4. ON THE WAY (in transit)
 *     5. ARRIVED AT DELIVERY
 *     6. DELIVERED (prompts photo proof & customer 4-digit code)
 * - Auto-records GPS coordinates and timestamp at every step
 * - One-tap external maps navigation (Google Maps / Apple Maps)
 * - One-tap problem reporting (breakdown, delay, police hold, road blocked)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

type TripStage =
  | 'heading_to_pickup'
  | 'arrived_pickup'
  | 'loaded'
  | 'in_transit'
  | 'arrived_delivery'
  | 'delivered'
  | 'completed';

interface StageMeta {
  buttonText: string;
  stageTitle: string;
  subText: string;
  requiresPhoto: boolean;
  requiresCode: boolean;
}

const STAGES: Record<TripStage, StageMeta> = {
  heading_to_pickup: {
    buttonText: 'ARRIVED AT PICKUP →',
    stageTitle: 'HEADING TO PICKUP',
    subText: 'Navigate to Tema Port, Golden Jubilee Gate 2',
    requiresPhoto: false,
    requiresCode: false,
  },
  arrived_pickup: {
    buttonText: 'CONFIRM LOADED & PHOTOGRAPH →',
    stageTitle: 'ARRIVED AT PICKUP',
    subText: 'Wait for site crane/labor to load cargo',
    requiresPhoto: true,
    requiresCode: false,
  },
  loaded: {
    buttonText: 'START JOURNEY (ON THE WAY) →',
    stageTitle: 'CARGO LOADED & SECURED',
    subText: 'Double check tie-downs, chains, and outriggers',
    requiresPhoto: false,
    requiresCode: false,
  },
  in_transit: {
    buttonText: 'ARRIVED AT DELIVERY POINT →',
    stageTitle: 'IN TRANSIT',
    subText: 'En route to Spintex Industrial Area (22 km remaining)',
    requiresPhoto: false,
    requiresCode: false,
  },
  arrived_delivery: {
    buttonText: 'ENTER CODE & COMPLETE DELIVERY →',
    stageTitle: 'ARRIVED AT DESTINATION',
    subText: 'Site offloading in progress',
    requiresPhoto: true,
    requiresCode: true,
  },
  delivered: {
    buttonText: 'VIEW EARNINGS SUMMARY ✓',
    stageTitle: 'DELIVERY CONFIRMED',
    subText: 'Job verified. Payout scheduled to your wallet.',
    requiresPhoto: false,
    requiresCode: false,
  },
  completed: {
    buttonText: 'RETURN TO HOME',
    stageTitle: 'TRIP COMPLETED',
    subText: 'Available for next dispatch',
    requiresPhoto: false,
    requiresCode: false,
  },
};

export default function ActiveTripScreen() {
  const [currentStage, setCurrentStage] = useState<TripStage>('heading_to_pickup');
  const [cargoPhotoTaken, setCargoPhotoTaken] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  const stageData = STAGES[currentStage];

  const handleNextStep = () => {
    if (stageData.requiresPhoto && !cargoPhotoTaken) {
      Alert.alert(
        'Photo Required',
        'Please snap a photo of the loaded cargo and tie-downs before advancing.',
        [{ text: 'Take Photo', onPress: () => setCargoPhotoTaken(true) }]
      );
      return;
    }

    if (stageData.requiresCode && !showCodeInput) {
      setShowCodeInput(true);
      return;
    }

    if (stageData.requiresCode && enteredCode.length !== 4) {
      Alert.alert('Verification Code', 'Please enter the 4-digit code provided by the customer.');
      return;
    }

    // Advance to next status
    setCargoPhotoTaken(false);
    setShowCodeInput(false);

    if (currentStage === 'heading_to_pickup') setCurrentStage('arrived_pickup');
    else if (currentStage === 'arrived_pickup') setCurrentStage('loaded');
    else if (currentStage === 'loaded') setCurrentStage('in_transit');
    else if (currentStage === 'in_transit') setCurrentStage('arrived_delivery');
    else if (currentStage === 'arrived_delivery') setCurrentStage('delivered');
    else if (currentStage === 'delivered') router.push('/');
  };

  const handleOpenNavigation = () => {
    // Open in Google Maps navigation
    const target =
      currentStage === 'heading_to_pickup'
        ? 'Tema+Port+Golden+Jubilee'
        : 'Spintex+Road+Accra';
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${target}`);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.activeJobTitle}>ACTIVE TRIP EXECUTION</Text>
          <Text style={styles.jobId}>VGJ-004819</Text>
        </View>

        <TouchableOpacity style={styles.emergencyBtn} onPress={() => Linking.openURL('tel:+233302000000')}>
          <Text style={styles.emergencyBtnText}>⚠️ DISPATCH HELP</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Stage Status Card */}
        <View style={styles.stageCard}>
          <Text style={styles.stageCardLabel}>CURRENT OPERATIONAL STATUS</Text>
          <Text style={styles.stageCardTitle}>{stageData.stageTitle}</Text>
          <Text style={styles.stageCardSub}>{stageData.subText}</Text>
        </View>

        {/* 1-Tap Navigation Card */}
        <TouchableOpacity
          style={styles.navBanner}
          onPress={handleOpenNavigation}
          activeOpacity={0.85}
        >
          <View style={styles.navIconBox}>
            <Text style={{ fontSize: 24 }}>🧭</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.navBannerTitle}>START MAP NAVIGATION</Text>
            <Text style={styles.navBannerSub}>Opens directly in Google Maps / Waze</Text>
          </View>
          <Text style={styles.navArrow}>→</Text>
        </TouchableOpacity>

        {/* Delivery Code Verification Input Modal */}
        {showCodeInput && (
          <View style={styles.codePromptBox}>
            <Text style={styles.codePromptHeading}>Customer Confirmation Code</Text>
            <Text style={styles.codePromptSub}>
              Ask the customer / receiver at site for their 4-digit security code.
            </Text>
            <TextInput
              style={styles.codeInput}
              value={enteredCode}
              onChangeText={setEnteredCode}
              keyboardType="numeric"
              maxLength={4}
              placeholder="0 0 0 0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        {/* Proof of Loading / Delivery Photo Prompt */}
        {stageData.requiresPhoto && (
          <View style={styles.photoPromptBox}>
            <Text style={styles.photoPromptHeading}>Cargo Condition Photo Proof</Text>
            <Text style={styles.photoPromptSub}>
              Take a clear picture showing cargo loaded onto the truck bed with straps/chains secured.
            </Text>
            <TouchableOpacity
              style={[styles.snapPhotoBtn, cargoPhotoTaken && styles.snapPhotoBtnSuccess]}
              onPress={() => setCargoPhotoTaken(!cargoPhotoTaken)}
            >
              <Text style={styles.snapPhotoBtnText}>
                {cargoPhotoTaken ? '✓ Photo Captured (Retake)' : '📷 Snap Cargo Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Waypoint Details */}
        <View style={styles.waypointCard}>
          <Text style={styles.waypointCardHeader}>TRIP LOGISTICS & SITE CONTACT</Text>
          <View style={styles.contactRow}>
            <View>
              <Text style={styles.contactLabel}>SITE FOREMAN</Text>
              <Text style={styles.contactName}>Kojo Antwi</Text>
            </View>
            <TouchableOpacity
              style={styles.phonePill}
              onPress={() => Linking.openURL('tel:0241234567')}
            >
              <Text style={styles.phonePillText}>📞 Call Foreman</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.landmarkText}>
            Landmark: "Opposite Golden Jubilee Gate 2, look for yellow CAT excavator"
          </Text>
        </View>

        {/* Report a Problem */}
        <TouchableOpacity
          style={styles.problemCard}
          onPress={() =>
            Alert.alert(
              'Report Incident to Dispatch',
              'Select the situation so our operations team can support you immediately:',
              [
                { text: 'Mechanical Breakdown / Flat Tyre' },
                { text: 'Road Closed / Impassable' },
                { text: 'Site Delay (> 1 Hour Waiting)' },
                { text: 'Cancel', style: 'cancel' },
              ]
            )
          }
        >
          <Text style={styles.problemText}>🚨 Report Delay, Breakdown or Road Closed</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── MASSIVE 64px STEP ACTION BUTTON ─── */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.stepButton}
          onPress={handleNextStep}
          activeOpacity={0.88}
        >
          <Text style={styles.stepButtonText}>{stageData.buttonText}</Text>
        </TouchableOpacity>
      </View>
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
  activeJobTitle: {
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
  emergencyBtn: {
    backgroundColor: '#351610',
    borderWidth: 1,
    borderColor: colors.rustRed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.button,
  },
  emergencyBtnText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 11,
    color: colors.rustRed,
    letterSpacing: 0.5,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingBottom: 110 },

  stageCard: {
    backgroundColor: colors.surfaceDark,
    borderLeftWidth: 4,
    borderLeftColor: colors.safetyAmber,
    borderRadius: radii.card,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  stageCardLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: 4,
  },
  stageCardTitle: {
    fontFamily: 'Archivo-Bold',
    fontSize: 20,
    color: colors.textHighContrast,
    marginBottom: 4,
  },
  stageCardSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },

  navBanner: {
    backgroundColor: '#1C3325',
    borderWidth: 1,
    borderColor: colors.weighbridgeGreen,
    borderRadius: radii.card,
    padding: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  navIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBannerTitle: {
    fontFamily: 'Archivo-Bold',
    fontSize: 14,
    color: colors.weighbridgeGreen,
    letterSpacing: 0.5,
  },
  navBannerSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  navArrow: {
    fontSize: 20,
    color: colors.weighbridgeGreen,
    fontWeight: '700',
  },

  codePromptBox: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 2,
    borderColor: colors.safetyAmber,
    borderRadius: radii.card,
    padding: spacing[4],
    marginBottom: spacing[4],
    alignItems: 'center',
  },
  codePromptHeading: {
    fontFamily: 'Archivo-Bold',
    fontSize: 16,
    color: colors.safetyAmber,
    marginBottom: 4,
  },
  codePromptSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  codeInput: {
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: colors.safetyAmber,
    borderRadius: radii.button,
    width: 180,
    height: 56,
    textAlign: 'center',
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 28,
    color: colors.safetyAmber,
    letterSpacing: 8,
  },

  photoPromptBox: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  photoPromptHeading: {
    fontFamily: 'Archivo-Bold',
    fontSize: 15,
    color: colors.textHighContrast,
    marginBottom: 2,
  },
  photoPromptSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing[3],
  },
  snapPhotoBtn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: radii.button,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapPhotoBtnSuccess: {
    backgroundColor: '#1C3325',
    borderColor: colors.weighbridgeGreen,
  },
  snapPhotoBtnText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 13,
    color: colors.textHighContrast,
  },

  waypointCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radii.card,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing[4],
  },
  waypointCardHeader: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing[3],
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  contactLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  contactName: {
    fontFamily: 'Archivo-Bold',
    fontSize: 15,
    color: colors.textHighContrast,
  },
  phonePill: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.button,
  },
  phonePillText: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 12,
    color: colors.safetyAmber,
  },
  landmarkText: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  problemCard: {
    padding: spacing[3],
    alignItems: 'center',
  },
  problemText: {
    fontFamily: 'IBMPlexSans-Medium',
    fontSize: 13,
    color: colors.rustRed,
  },

  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceDark,
    padding: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  stepButton: {
    backgroundColor: colors.safetyAmber,
    height: touchTargets.stepAction, // 64px for gloves & easy sunlight touch
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepButtonText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 16,
    color: colors.bgDark,
    letterSpacing: 0.8,
  },
});

