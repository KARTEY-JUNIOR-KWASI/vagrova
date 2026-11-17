/**
 * Vagrova Customer App — Vehicle Type Picker
 *
 * Step 1 of the booking flow.
 * Large picture cards — NOT a dropdown.
 * Each card shows the custom truck illustration, tonnage, and typical use.
 * "Not sure" card at the end offers guidance or the call-center button.
 *
 * One question per screen. Progress bar. Back never loses data.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

const CALL_CENTER_NUMBER = 'tel:+233302000000';

interface VehicleCardData {
  type: string;
  label: string;
  capacity: string;
  use: string;
  emoji: string; // placeholder until custom SVG icons are rendered natively
}

const VEHICLES: VehicleCardData[] = [
  { type: 'tipper',            label: 'Tipper',            capacity: 'Up to 30 tonnes',         use: 'Sand, gravel, laterite, aggregate',               emoji: '🚛' },
  { type: 'flatbed',           label: 'Flatbed',           capacity: 'Up to 40 tonnes',         use: 'Machinery, steel, timber, general cargo',          emoji: '🚚' },
  { type: 'lowbed',            label: 'Lowbed',            capacity: 'Up to 60 tonnes',         use: 'Heavy plant, excavators, bulldozers',              emoji: '🚛' },
  { type: 'container_carrier', label: 'Container Carrier', capacity: '20ft & 40ft containers',  use: 'Shipping containers — port runs',                  emoji: '🚢' },
  { type: 'tanker',            label: 'Tanker',            capacity: 'Up to 30,000 litres',     use: 'Fuel, water, chemicals, edible liquids',           emoji: '⛽' },
  { type: 'crane_truck',       label: 'Crane Truck',       capacity: 'Up to 50 tonnes lift',    use: 'Lifting heavy loads at site',                      emoji: '🏗️' },
  { type: 'tow_recovery',      label: 'Tow / Recovery',   capacity: 'Up to 10 tonnes',         use: 'Broken-down vehicles',                             emoji: '🔧' },
  { type: 'refrigerated',      label: 'Refrigerated',      capacity: 'Up to 20 tonnes',         use: 'Perishable goods, frozen produce',                 emoji: '❄️' },
];

export default function VehicleTypePicker() {
  const handleSelect = (type: string) => {
    router.push({ pathname: '/book/pickup-delivery', params: { vehicleType: type } });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.asphalt} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 1 of 5</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '20%' }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        <Text style={styles.heading}>What type of truck do you need?</Text>
        <Text style={styles.subheading}>Choose the one that best fits your load.</Text>

        {/* Vehicle cards — 2-column grid */}
        <View style={styles.grid}>
          {VEHICLES.map((v) => (
            <TouchableOpacity
              key={v.type}
              style={styles.vehicleCard}
              onPress={() => handleSelect(v.type)}
              activeOpacity={0.8}
              accessibilityLabel={`${v.label} — ${v.use}`}
              accessibilityRole="button"
            >
              <Text style={styles.vehicleEmoji}>{v.emoji}</Text>
              <Text style={styles.vehicleLabel}>{v.label}</Text>
              <Text style={styles.vehicleCapacity}>{v.capacity}</Text>
              <Text style={styles.vehicleUse}>{v.use}</Text>
            </TouchableOpacity>
          ))}

          {/* "Not sure" card */}
          <TouchableOpacity
            style={[styles.vehicleCard, styles.notSureCard]}
            onPress={() => Linking.openURL(CALL_CENTER_NUMBER)}
            activeOpacity={0.8}
            accessibilityLabel="Not sure — call us for help choosing"
          >
            <Text style={styles.vehicleEmoji}>❓</Text>
            <Text style={[styles.vehicleLabel, { color: colors.waybillPaper }]}>Not sure?</Text>
            <Text style={[styles.vehicleUse, { color: 'rgba(245,242,235,0.6)' }]}>
              Tell us your load — we'll recommend the right truck or connect you to our team.
            </Text>
            <View style={styles.callChip}>
              <Text style={styles.callChipText}>📞 Call us to choose</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Fixed Call Vagrova bar */}
      <TouchableOpacity
        style={styles.callVagrovaBar}
        onPress={() => Linking.openURL(CALL_CENTER_NUMBER)}
        activeOpacity={0.9}
        accessibilityLabel="Call Vagrova"
      >
        <Text style={styles.callVagrovaText}>📞  CALL VAGROVA</Text>
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

  progressTrack: { height: 3, backgroundColor: colors.asphaltLight ?? '#2E3539' },
  progressFill: { height: 3, backgroundColor: colors.safetyAmber },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingBottom: 80 },

  heading: {
    fontFamily: 'Archivo-Bold',
    fontSize: 22,
    color: colors.asphalt,
    marginBottom: spacing[1.5],
  },
  subheading: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 14,
    color: colors.gravelGrey,
    marginBottom: spacing[5],
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  vehicleCard: {
    width: '47%',
    backgroundColor: colors.roadWhite,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.card,
    padding: spacing[3],
    minHeight: 150,
  },
  vehicleEmoji: { fontSize: 32, marginBottom: spacing[2] },
  vehicleLabel: {
    fontFamily: 'Archivo-Bold',
    fontSize: 15,
    color: colors.asphalt,
    marginBottom: 2,
  },
  vehicleCapacity: {
    fontFamily: 'IBMPlexMono-Regular',
    fontSize: 10,
    color: colors.gravelGrey,
    letterSpacing: 0.3,
    marginBottom: spacing[1.5],
  },
  vehicleUse: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 11,
    color: colors.gravelGrey,
    lineHeight: 16,
  },

  notSureCard: {
    width: '100%',
    backgroundColor: colors.asphalt,
    borderColor: colors.asphalt,
  },
  callChip: {
    marginTop: spacing[3],
    alignSelf: 'flex-start',
    backgroundColor: colors.safetyAmber,
    borderRadius: radii.button,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
  },
  callChipText: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 12,
    color: colors.asphalt,
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
  callVagrovaText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 14,
    color: colors.asphalt,
    letterSpacing: 0.6,
  },
});

