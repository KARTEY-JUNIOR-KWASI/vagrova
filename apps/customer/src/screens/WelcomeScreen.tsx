/**
 * Vagrova Customer App — Welcome Screen
 *
 * Official Vagrova logo, language switcher (EN / TWI / GA),
 * "Get Started" (first-time OTP onboarding) and "Call Vagrova to Book".
 * Zero emojis — uses crisp Feather vector icons.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

const CALL_CENTER_NUMBER = 'tel:+233302000000';

export default function WelcomeScreen() {
  const [language, setLanguage] = useState<'EN' | 'TWI' | 'GA'>('EN');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.roadWhite} />

      {/* Top Language Bar */}
      <View style={styles.topBar}>
        <Text style={styles.marketTag}>GHANA · GHS</Text>
        <View style={styles.langRow}>
          {(['EN', 'TWI', 'GA'] as const).map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => setLanguage(lang)}
              style={[styles.langBtn, language === lang && styles.langBtnActive]}
            >
              <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Center Brand Stage */}
      <View style={styles.centerStage}>
        <Image
          source={require('../../assets/vagrova-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Vagrova logo"
        />
        <View style={styles.amberRule} />

        <Text style={styles.headline}>Heavy haulage, dispatched right.</Text>
        <Text style={styles.subhead}>
          Book tippers, flatbeds, lowbeds, container carriers, tankers, and crane trucks — with upfront quotes and live tracking.
        </Text>
      </View>

      {/* Bottom Action Panel */}
      <View style={styles.bottomPanel}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/auth')}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
          <Feather name="arrow-right" size={18} color={colors.asphalt} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Linking.openURL(CALL_CENTER_NUMBER)}
          activeOpacity={0.88}
        >
          <Feather name="phone" size={16} color={colors.safetyAmber} />
          <Text style={styles.callBtnText}>Call Vagrova to Book (+233 30 200 0000)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.roadWhite,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingTop: 54,
    paddingHorizontal: spacing[5],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marketTag: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 11,
    color: colors.gravelGrey,
    letterSpacing: 1,
  },
  langRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.button,
    overflow: 'hidden',
  },
  langBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: colors.roadWhite,
  },
  langBtnActive: {
    backgroundColor: colors.asphalt,
  },
  langText: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 11,
    color: colors.gravelGrey,
  },
  langTextActive: {
    color: colors.safetyAmber,
  },
  centerStage: {
    paddingHorizontal: spacing[6],
  },
  logo: {
    width: 240,
    height: 64,
    marginBottom: spacing[4],
  },
  amberRule: {
    height: 4,
    width: '100%',
    backgroundColor: colors.safetyAmber,
    borderRadius: 2,
    marginBottom: spacing[6],
  },
  headline: {
    fontFamily: 'Archivo-Bold',
    fontSize: 30,
    color: colors.asphalt,
    lineHeight: 34,
    marginBottom: spacing[3],
  },
  subhead: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 15,
    color: colors.gravelGrey,
    lineHeight: 22,
  },
  bottomPanel: {
    backgroundColor: colors.waybillPaper,
    borderTopWidth: 1,
    borderTopColor: colors.grey200,
    padding: spacing[5],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  primaryBtn: {
    height: touchTargets.primary,
    backgroundColor: colors.safetyAmber,
    borderRadius: radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  primaryBtnText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 17,
    color: colors.asphalt,
  },
  callBtn: {
    height: touchTargets.min,
    backgroundColor: colors.asphalt,
    borderRadius: radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  callBtnText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 14,
    color: colors.roadWhite,
  },
});
