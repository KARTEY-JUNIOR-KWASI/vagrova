/**
 * Vagrova Customer App — Pickup & Delivery Screen
 *
 * Step 2 of the booking flow.
 * - Map pin with address search + "Use my current location"
 * - Supports extra stops / waypoints
 * - Contact person name & phone for both pickup and delivery
 * - Free-text landmark note (crucial for informal addresses in Ghana)
 * - Voice note recording toggle on text fields
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

const CALL_CENTER_NUMBER = 'tel:+233302000000';

export default function PickupDeliveryScreen() {
  const params = useLocalSearchParams();
  const vehicleType = params.vehicleType || 'flatbed';

  const [pickupAddress, setPickupAddress] = useState('Tema Port, Container Terminal 3');
  const [pickupContactName, setPickupContactName] = useState('Kojo Antwi');
  const [pickupContactPhone, setPickupContactPhone] = useState('024 123 4567');
  const [pickupLandmark, setPickupLandmark] = useState('Opposite Golden Jubilee Gate 2');

  const [deliveryAddress, setDeliveryAddress] = useState('Spintex Road, Industrial Area');
  const [deliveryContactName, setDeliveryContactName] = useState('Nana Kwame');
  const [deliveryContactPhone, setDeliveryContactPhone] = useState('055 987 6543');
  const [deliveryLandmark, setDeliveryLandmark] = useState('Behind Kasapreko Depot, near blue warehouse');

  const [isRecordingPickupVoice, setIsRecordingPickupVoice] = useState(false);

  const handleNext = () => {
    router.push({
      pathname: '/book/load-details',
      params: {
        vehicleType,
        pickupAddress,
        pickupContactName,
        pickupContactPhone,
        pickupLandmark,
        deliveryAddress,
        deliveryContactName,
        deliveryContactPhone,
        deliveryLandmark,
      },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.asphalt} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 2 of 5</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '40%' }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Where is the load moving?</Text>
        <Text style={styles.subheading}>Provide exact points, contacts, and recognizable landmarks.</Text>

        {/* PICKUP SECTION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.markerBadge, { backgroundColor: colors.asphalt }]}>
              <Text style={styles.markerText}>A</Text>
            </View>
            <Text style={styles.sectionTitle}>Pickup Point</Text>
          </View>

          <Text style={styles.inputLabel}>Location or Address</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="e.g. Tema Port, Golden Jubilee"
              placeholderTextColor={colors.grey300}
            />
            <TouchableOpacity style={styles.locationGpsBtn} activeOpacity={0.7}>
              <Text style={styles.locationGpsText}>📍 GPS</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Contact Name</Text>
              <TextInput
                style={styles.textInput}
                value={pickupContactName}
                onChangeText={setPickupContactName}
                placeholder="Site Foreman / Contact"
                placeholderTextColor={colors.grey300}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={pickupContactPhone}
                onChangeText={setPickupContactPhone}
                keyboardType="phone-pad"
                placeholder="024 XXX XXXX"
                placeholderTextColor={colors.grey300}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Landmark / Directions</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={pickupLandmark}
              onChangeText={setPickupLandmark}
              placeholder="e.g. Behind the shell station, red gate"
              placeholderTextColor={colors.grey300}
            />
            <TouchableOpacity
              style={[styles.voiceBtn, isRecordingPickupVoice && styles.voiceBtnActive]}
              onPress={() => setIsRecordingPickupVoice(!isRecordingPickupVoice)}
              accessibilityLabel="Record voice note with directions"
            >
              <Text style={styles.voiceBtnText}>{isRecordingPickupVoice ? '⏹️ Rec...' : '🎙️ Voice'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DELIVERY SECTION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.markerBadge, { backgroundColor: colors.safetyAmber }]}>
              <Text style={[styles.markerText, { color: colors.asphalt }]}>B</Text>
            </View>
            <Text style={styles.sectionTitle}>Delivery Point</Text>
          </View>

          <Text style={styles.inputLabel}>Destination Address</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="e.g. Spintex Heavy Industrial Area"
              placeholderTextColor={colors.grey300}
            />
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Receiver Name</Text>
              <TextInput
                style={styles.textInput}
                value={deliveryContactName}
                onChangeText={setDeliveryContactName}
                placeholder="Receiver name"
                placeholderTextColor={colors.grey300}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Receiver Phone</Text>
              <TextInput
                style={styles.textInput}
                value={deliveryContactPhone}
                onChangeText={setDeliveryContactPhone}
                keyboardType="phone-pad"
                placeholder="055 XXX XXXX"
                placeholderTextColor={colors.grey300}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Delivery Landmark & Gate Notes</Text>
          <TextInput
            style={styles.textInput}
            value={deliveryLandmark}
            onChangeText={setDeliveryLandmark}
            placeholder="e.g. NearKasapreko depot, blue double gates"
            placeholderTextColor={colors.grey300}
          />
        </View>

        {/* Continue CTA */}
        <TouchableOpacity style={styles.primaryActionBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.primaryActionBtnText}>Next: Load Details →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Call Vagrova button */}
      <TouchableOpacity
        style={styles.callVagrovaBar}
        onPress={() => Linking.openURL(CALL_CENTER_NUMBER)}
        activeOpacity={0.9}
      >
        <Text style={styles.callVagrovaText}>📞  CALL VAGROVA TO ASSIST</Text>
      </TouchableOpacity>
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
  stepLabel: { fontFamily: 'IBMPlexMono-Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
  progressTrack: { height: 3, backgroundColor: '#2E3539' },
  progressFill: { height: 3, backgroundColor: colors.safetyAmber },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingBottom: 90 },

  heading: { fontFamily: 'Archivo-Bold', fontSize: 22, color: colors.asphalt, marginBottom: spacing[1] },
  subheading: { fontFamily: 'IBMPlexSans-Regular', fontSize: 14, color: colors.gravelGrey, marginBottom: spacing[4] },

  sectionCard: {
    backgroundColor: colors.roadWhite,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.card,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  markerBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  markerText: { color: colors.roadWhite, fontWeight: '700', fontSize: 12, fontFamily: 'IBMPlexMono-Bold' },
  sectionTitle: { fontFamily: 'Archivo-Bold', fontSize: 16, color: colors.asphalt },

  inputLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.gravelGrey,
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  textInput: {
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: radii.button,
    paddingHorizontal: spacing[3],
    height: 44,
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 14,
    color: colors.asphalt,
    backgroundColor: colors.roadWhite,
    flex: 1,
  },
  locationGpsBtn: {
    backgroundColor: colors.grey100,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.button,
    paddingHorizontal: spacing[3],
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationGpsText: { fontFamily: 'IBMPlexSans-SemiBold', fontSize: 12, color: colors.asphalt },
  voiceBtn: {
    backgroundColor: colors.grey100,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.button,
    paddingHorizontal: spacing[3],
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceBtnActive: { backgroundColor: colors.redLight, borderColor: colors.rustRed },
  voiceBtnText: { fontFamily: 'IBMPlexSans-SemiBold', fontSize: 12, color: colors.asphalt },

  twoCol: { flexDirection: 'row', gap: spacing[3] },

  primaryActionBtn: {
    backgroundColor: colors.asphalt,
    borderRadius: radii.button,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[3],
  },
  primaryActionBtnText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 15,
    color: colors.safetyAmber,
    letterSpacing: 0.5,
  },

  callVagrovaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.safetyAmber,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callVagrovaText: { fontFamily: 'Archivo-Bold', fontSize: 14, color: colors.asphalt, letterSpacing: 0.6 },
});

