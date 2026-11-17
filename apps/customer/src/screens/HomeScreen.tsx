/**
 * Vagrova Customer App — Home Screen
 *
 * Two equal choices:
 *   1. Book a truck (self-service flow)
 *   2. Call us to book for you (call center)
 *
 * Full-width amber "Call Vagrova" button always visible at the bottom.
 * Voice note button on every text field.
 * Picture-first design — icons on every important choice.
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
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

const CALL_CENTER_NUMBER = 'tel:+233302000000';

export default function HomeScreen() {
  const handleCall = () => {
    Linking.openURL(CALL_CENTER_NUMBER);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.asphalt} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>VAG<Text style={styles.wordmarkAccent}>ROVA</Text></Text>
        <Text style={styles.headerSub}>Heavy Haulage · Ghana</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Greeting */}
        <Text style={styles.greeting}>Good morning, Samuel</Text>
        <Text style={styles.greetingSub}>What do you need today?</Text>

        {/* Two primary choices — equal prominence */}
        <View style={styles.choiceRow}>

          {/* Book a truck */}
          <TouchableOpacity
            style={[styles.choiceCard, styles.choiceCardPrimary]}
            onPress={() => router.push('/book/vehicle-type')}
            activeOpacity={0.85}
            accessibilityLabel="Book a truck — start the booking flow"
            accessibilityRole="button"
          >
            {/* Truck illustration placeholder */}
            <View style={styles.choiceIcon}>
              <Feather name="truck" size={32} color={colors.asphalt} />
            </View>
            <Text style={styles.choiceTitle}>Book a truck</Text>
            <Text style={styles.choiceSub}>Get a quote in minutes</Text>
          </TouchableOpacity>

          {/* Call us */}
          <TouchableOpacity
            style={[styles.choiceCard, styles.choiceCardSecondary]}
            onPress={handleCall}
            activeOpacity={0.85}
            accessibilityLabel="Call us to book for you"
            accessibilityRole="button"
          >
            <View style={styles.choiceIcon}>
              <Feather name="phone-call" size={32} color={colors.safetyAmber} />
            </View>
            <Text style={[styles.choiceTitle, { color: colors.waybillPaper }]}>Call us to book</Text>
            <Text style={[styles.choiceSub, { color: 'rgba(245,242,235,0.6)' }]}>We handle everything for you</Text>
          </TouchableOpacity>

        </View>

        {/* Call me back option */}
        <TouchableOpacity
          style={styles.callBackBanner}
          onPress={() => router.push('/call-back')}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="phone-incoming" size={15} color={colors.asphalt} />
            <Text style={styles.callBackText}>Request a call-back — we will call you</Text>
          </View>
        </TouchableOpacity>

        {/* Active jobs */}
        <Text style={styles.sectionLabel}>Active Jobs</Text>

        <View style={styles.jobCard}>
          <View style={styles.jobCardTop}>
            <Text style={styles.jobId}>VGJ-004819</Text>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>BOOKED</Text>
            </View>
          </View>
          <Text style={styles.jobRoute}>Kasoa → Accra Industrial Area</Text>
          <Text style={styles.jobDetail}>Flatbed · 14 tonnes · Yaw Boateng</Text>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.push('/jobs/VGJ-004819/track')}
          >
            <Text style={styles.trackButtonText}>Track →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ─── CALL VAGROVA — always visible, full-width amber bar ─────────── */}
      <TouchableOpacity
        style={styles.callVagrovaBar}
        onPress={handleCall}
        activeOpacity={0.9}
        accessibilityLabel="Call Vagrova"
        accessibilityRole="button"
      >
        <Feather name="phone" size={18} color={colors.asphalt} />
        <Text style={styles.callVagrovaText}>CALL VAGROVA</Text>
        <Text style={styles.callVagrovaNumber}>+233 30 200 0000</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.waybillPaper,
  },

  // Header
  header: {
    backgroundColor: colors.asphalt,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: spacing[4],
  },
  wordmark: {
    fontFamily: 'Archivo-Bold',
    fontSize: 26,
    color: colors.roadWhite,
    letterSpacing: -0.5,
  },
  wordmarkAccent: {
    color: colors.safetyAmber,
  },
  headerSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },

  // Greeting
  greeting: {
    fontFamily: 'Archivo-Bold',
    fontSize: 22,
    color: colors.asphalt,
    marginBottom: 2,
    marginTop: spacing[2],
  },
  greetingSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 15,
    color: colors.gravelGrey,
    marginBottom: spacing[5],
  },

  // Two-choice row
  choiceRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  choiceCard: {
    flex: 1,
    borderRadius: radii.card,
    padding: spacing[4],
    minHeight: 150,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: colors.grey200,
  },
  choiceCardPrimary: {
    backgroundColor: colors.roadWhite,
  },
  choiceCardSecondary: {
    backgroundColor: colors.asphalt,
    borderColor: colors.asphalt,
  },
  choiceIcon: {
    marginBottom: spacing[2],
  },
  choiceTitle: {
    fontFamily: 'Archivo-Bold',
    fontSize: 17,
    color: colors.asphalt,
    marginBottom: 2,
  },
  choiceSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: colors.gravelGrey,
  },

  // Call-back banner
  callBackBanner: {
    backgroundColor: colors.grey100,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.card,
    padding: spacing[3],
    marginBottom: spacing[5],
    alignItems: 'center',
  },
  callBackText: {
    fontFamily: 'IBMPlexSans-Medium',
    fontSize: 13,
    color: colors.asphalt,
  },

  // Section label
  sectionLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.gravelGrey,
    marginBottom: spacing[2],
  },

  // Job card
  jobCard: {
    backgroundColor: colors.roadWhite,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.card,
    padding: spacing[4],
  },
  jobCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1.5],
  },
  jobId: {
    fontFamily: 'IBMPlexMono-Medium',
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.gravelGrey,
  },
  statusChip: {
    borderLeftWidth: 3,
    borderLeftColor: colors.weighbridgeGreen,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 0,
  },
  statusChipText: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#1C5235',
  },
  jobRoute: {
    fontFamily: 'Archivo-SemiBold',
    fontSize: 15,
    color: colors.asphalt,
    marginBottom: 2,
  },
  jobDetail: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: colors.gravelGrey,
    marginBottom: spacing[3],
  },
  trackButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.safetyAmber,
    borderRadius: radii.button,
    paddingHorizontal: spacing[4],
    height: touchTargets.min,
    justifyContent: 'center',
  },
  trackButtonText: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 14,
    color: colors.asphalt,
    letterSpacing: 0.3,
  },

  // Call Vagrova — fixed amber bar
  callVagrovaBar: {
    backgroundColor: colors.safetyAmber,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    height: 56,
    paddingHorizontal: spacing[4],
  },
  callVagrovaIcon: {
    fontSize: 20,
  },
  callVagrovaText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 15,
    color: colors.asphalt,
    letterSpacing: 0.6,
  },
  callVagrovaNumber: {
    fontFamily: 'IBMPlexMono-Medium',
    fontSize: 12,
    color: colors.asphalt,
    opacity: 0.7,
    marginLeft: 4,
  },
});

