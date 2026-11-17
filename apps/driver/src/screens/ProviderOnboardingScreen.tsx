/**
 * Vagrova Driver / Owner App — Provider Sign-Up & Onboarding
 *
 * 1. Phone + OTP
 * 2. Role selection (Owner / Driver / Owner & Driver)
 * 3. Name, home town, next of kin
 * 4. Vehicle registration & 5 compliance documents
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

export default function ProviderOnboardingScreen() {
  const [step, setStep] = useState<'phone' | 'role' | 'details' | 'truck'>('phone');
  const [phone, setPhone] = useState('');
  const [kind, setKind] = useState<'OWNER_AND_DRIVER' | 'OWNER' | 'DRIVER'>('OWNER_AND_DRIVER');
  const [fullName, setFullName] = useState('');
  const [homeTown, setHomeTown] = useState('');
  const [nextOfKin, setNextOfKin] = useState('');
  const [plate, setPlate] = useState('');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      <View style={styles.topBar}>
        <Text style={styles.wordmark}>
          VAG<Text style={{ color: colors.safetyAmber }}>ROVA</Text> DRIVER
        </Text>
        <Text style={styles.stepText}>{step.toUpperCase()}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {step === 'phone' && (
          <View>
            <Text style={styles.heading}>Register as Owner or Driver</Text>
            <Text style={styles.sub}>Enter your mobile number to receive a 6-digit verification code.</Text>
            <Text style={styles.label}>GHANA PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+233 24 881 2290"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        {step === 'role' && (
          <View>
            <Text style={styles.heading}>How do you operate?</Text>
            {[
              { id: 'OWNER_AND_DRIVER', title: 'Owner & Driver', desc: 'Own truck and drive it yourself' },
              { id: 'OWNER', title: 'Truck Owner (Fleet)', desc: 'Manage 1+ trucks and hired drivers' },
              { id: 'DRIVER', title: 'Driver Only', desc: 'Drive assigned trucks' },
            ].map((item) => {
              const active = kind === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.roleCard, active && styles.roleCardActive]}
                  onPress={() => setKind(item.id as any)}
                >
                  <Feather name="truck" size={20} color={active ? colors.safetyAmber : colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleTitle}>{item.title}</Text>
                    <Text style={styles.roleDesc}>{item.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 'details' && (
          <View>
            <Text style={styles.heading}>Personal & Next of Kin</Text>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput style={[styles.input, { marginBottom: spacing[3] }]} value={fullName} onChangeText={setFullName} placeholder="Yaw Boateng" placeholderTextColor={colors.textMuted} />
            <Text style={styles.label}>HOME TOWN</Text>
            <TextInput style={[styles.input, { marginBottom: spacing[3] }]} value={homeTown} onChangeText={setHomeTown} placeholder="Kumasi" placeholderTextColor={colors.textMuted} />
            <Text style={styles.label}>NEXT OF KIN NAME & PHONE</Text>
            <TextInput style={styles.input} value={nextOfKin} onChangeText={setNextOfKin} placeholder="Abena Boateng · 024 771 9900" placeholderTextColor={colors.textMuted} />
          </View>
        )}

        {step === 'truck' && (
          <View>
            <Text style={styles.heading}>Register Vehicle</Text>
            <Text style={styles.sub}>Your account enters Pending Verification until documents are approved.</Text>
            <Text style={styles.label}>PLATE NUMBER</Text>
            <TextInput
              style={styles.input}
              value={plate}
              onChangeText={(t) => setPlate(t.toUpperCase())}
              placeholder="GW-2290-22"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            if (step === 'phone') setStep('role');
            else if (step === 'role') setStep('details');
            else if (step === 'details') setStep(kind === 'DRIVER' ? 'truck' : 'truck');
            else router.replace('/');
          }}
        >
          <Text style={styles.primaryBtnText}>
            {step === 'truck' ? 'Submit & Open Dashboard' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  topBar: {
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: spacing[4],
    backgroundColor: colors.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordmark: { fontFamily: 'Archivo-Bold', fontSize: 18, color: colors.textHighContrast },
  stepText: { fontFamily: 'IBMPlexMono-Bold', fontSize: 11, color: colors.safetyAmber },
  content: { padding: spacing[4] },
  heading: { fontFamily: 'Archivo-Bold', fontSize: 24, color: colors.textHighContrast, marginBottom: spacing[2] },
  sub: { fontFamily: 'IBMPlexSans-Regular', fontSize: 13, color: colors.textMuted, marginBottom: spacing[4] },
  label: { fontFamily: 'IBMPlexSans-SemiBold', fontSize: 10, color: colors.textMuted, marginBottom: 6 },
  input: {
    height: 48,
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.button,
    paddingHorizontal: spacing[3],
    color: colors.textHighContrast,
    fontSize: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    marginBottom: spacing[3],
  },
  roleCardActive: { borderColor: colors.safetyAmber, backgroundColor: '#382B0A' },
  roleTitle: { fontFamily: 'Archivo-Bold', fontSize: 16, color: colors.textHighContrast },
  roleDesc: { fontFamily: 'IBMPlexSans-Regular', fontSize: 12, color: colors.textMuted },
  footer: {
    padding: spacing[4],
    paddingBottom: spacing[6],
    backgroundColor: colors.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  primaryBtn: {
    height: touchTargets.primary,
    backgroundColor: colors.safetyAmber,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: 'Archivo-Bold', fontSize: 16, color: colors.bgDark },
});
