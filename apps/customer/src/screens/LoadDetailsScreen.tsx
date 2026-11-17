/**
 * Vagrova Customer App — Load Details Screen
 *
 * Step 3 of the booking flow:
 * - Load type: building materials, machinery, containers, farm produce, general goods
 * - Estimated weight in tonnes
 * - Dimensions if oversized
 * - Toggles: Loading help needed, Offloading help needed, Fragile / Hazardous goods
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

const CALL_CENTER_NUMBER = 'tel:+233302000000';

const LOAD_CATEGORIES = [
  { id: 'building_materials', label: 'Building Materials', emoji: '🧱' },
  { id: 'machinery', label: 'Machinery / Plant', emoji: '🚜' },
  { id: 'containers', label: 'Shipping Container', emoji: '📦' },
  { id: 'farm_produce', label: 'Farm Produce', emoji: '🌾' },
  { id: 'general_goods', label: 'General Heavy Goods', emoji: '🏗️' },
];

export default function LoadDetailsScreen() {
  const params = useLocalSearchParams();

  const [selectedCategory, setSelectedCategory] = useState('machinery');
  const [estimatedTonnes, setEstimatedTonnes] = useState('24');
  const [description, setDescription] = useState('CAT 320D Excavator with bucket attachment');
  const [isOversized, setIsOversized] = useState(false);
  const [lengthMeters, setLengthMeters] = useState('9.5');
  const [widthMeters, setWidthMeters] = useState('3.2');
  const [heightMeters, setHeightMeters] = useState('3.1');

  const [needLoadingHelp, setNeedLoadingHelp] = useState(false);
  const [needOffloadingHelp, setNeedOffloadingHelp] = useState(true);
  const [isHazardous, setIsHazardous] = useState(false);

  const handleNext = () => {
    router.push({
      pathname: '/book/photos-upload',
      params: {
        ...params,
        category: selectedCategory,
        weightTonnes: estimatedTonnes,
        description,
        isOversized: isOversized ? 'true' : 'false',
        dimensions: isOversized ? `${lengthMeters}x${widthMeters}x${heightMeters}m` : 'Standard',
        needLoadingHelp: needLoadingHelp ? 'true' : 'false',
        needOffloadingHelp: needOffloadingHelp ? 'true' : 'false',
        isHazardous: isHazardous ? 'true' : 'false',
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
        <Text style={styles.stepLabel}>Step 3 of 5</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '60%' }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Describe your load</Text>
        <Text style={styles.subheading}>Accurate specs guarantee proper matching and reliable pricing.</Text>

        {/* Load Category Picker */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryWrap}>
          {LOAD_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Weight & Description */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Estimated Weight (Tonnes)</Text>
          <TextInput
            style={styles.textInput}
            value={estimatedTonnes}
            onChangeText={setEstimatedTonnes}
            keyboardType="numeric"
            placeholder="e.g. 25"
            placeholderTextColor={colors.grey300}
          />

          <Text style={styles.inputLabel}>Specific Cargo Description</Text>
          <TextInput
            style={[styles.textInput, { height: 64, textAlignVertical: 'top', paddingTop: 8 }]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Provide make, model, state, or packaging..."
            placeholderTextColor={colors.grey300}
          />
        </View>

        {/* Oversized Toggle & Dimensions */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleHeading}>Oversized or Wide Load</Text>
              <Text style={styles.toggleSub}>Requires escort or special permits</Text>
            </View>
            <Switch
              value={isOversized}
              onValueChange={setIsOversized}
              trackColor={{ false: colors.grey200, true: colors.safetyAmber }}
              thumbColor={isOversized ? colors.asphalt : '#f4f3f4'}
            />
          </View>

          {isOversized && (
            <View style={styles.dimensionsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Length (m)</Text>
                <TextInput
                  style={styles.textInput}
                  value={lengthMeters}
                  onChangeText={setLengthMeters}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Width (m)</Text>
                <TextInput
                  style={styles.textInput}
                  value={widthMeters}
                  onChangeText={setWidthMeters}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Height (m)</Text>
                <TextInput
                  style={styles.textInput}
                  value={heightMeters}
                  onChangeText={setHeightMeters}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </View>

        {/* Handling & Assistance Toggles */}
        <View style={styles.card}>
          <Text style={[styles.toggleHeading, { marginBottom: spacing[2] }]}>Handling & Site Logistics</Text>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Loading help / Crane needed at pickup</Text>
            <Switch
              value={needLoadingHelp}
              onValueChange={setNeedLoadingHelp}
              trackColor={{ false: colors.grey200, true: colors.safetyAmber }}
              thumbColor={needLoadingHelp ? colors.asphalt : '#f4f3f4'}
            />
          </View>

          <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: colors.grey100, paddingTop: 10, marginTop: 10 }]}>
            <Text style={styles.toggleLabel}>Offloading equipment needed at destination</Text>
            <Switch
              value={needOffloadingHelp}
              onValueChange={setNeedOffloadingHelp}
              trackColor={{ false: colors.grey200, true: colors.safetyAmber }}
              thumbColor={needOffloadingHelp ? colors.asphalt : '#f4f3f4'}
            />
          </View>

          <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: colors.grey100, paddingTop: 10, marginTop: 10 }]}>
            <Text style={styles.toggleLabel}>Fragile / Hazardous / Dangerous goods</Text>
            <Switch
              value={isHazardous}
              onValueChange={setIsHazardous}
              trackColor={{ false: colors.grey200, true: colors.rustRed }}
              thumbColor={isHazardous ? colors.rustRed : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Next Button */}
        <TouchableOpacity style={styles.primaryActionBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.primaryActionBtnText}>Next: Upload Load Photos →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Call Vagrova bar */}
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

  label: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.gravelGrey,
    marginBottom: spacing[2],
  },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.roadWhite,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.button,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
  },
  categoryPillSelected: {
    backgroundColor: colors.asphalt,
    borderColor: colors.asphalt,
  },
  categoryEmoji: { fontSize: 16 },
  categoryText: { fontFamily: 'IBMPlexSans-Medium', fontSize: 13, color: colors.asphalt },
  categoryTextSelected: { color: colors.safetyAmber },

  card: {
    backgroundColor: colors.roadWhite,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.card,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.gravelGrey,
    marginBottom: spacing[1],
  },
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
    marginBottom: spacing[3],
  },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[2] },
  toggleHeading: { fontFamily: 'Archivo-Bold', fontSize: 15, color: colors.asphalt },
  toggleSub: { fontFamily: 'IBMPlexSans-Regular', fontSize: 12, color: colors.gravelGrey },
  toggleLabel: { fontFamily: 'IBMPlexSans-Regular', fontSize: 13, color: colors.asphalt, flex: 1 },

  dimensionsRow: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] },

  primaryActionBtn: {
    backgroundColor: colors.asphalt,
    borderRadius: radii.button,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[2],
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

