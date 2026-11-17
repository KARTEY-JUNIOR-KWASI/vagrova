/**
 * Vagrova Customer App — First-Time User OTP Login & Profile Setup
 *
 * Step 1: Ghana phone number (+233)
 * Step 2: 6-digit OTP verification (no password)
 * Step 3: Individual or Company account profile
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

export default function AuthOnboardingScreen() {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.roadWhite} />

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            if (step === 'phone') router.back();
            else if (step === 'otp') setStep('phone');
            else setStep('otp');
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color={colors.asphalt} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>
          {step === 'phone' ? 'STEP 1 OF 3' : step === 'otp' ? 'STEP 2 OF 3' : 'STEP 3 OF 3'}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {step === 'phone' && (
          <View>
            <Text style={styles.heading}>Enter your phone number</Text>
            <Text style={styles.subheading}>
              We will send a 6-digit one-time code by SMS. No password needed.
            </Text>

            <Text style={styles.label}>GHANA MOBILE NUMBER</Text>
            <View style={styles.phoneRow}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefixText}>+233</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={phone}
                onChangeText={(t) => {
                  setError(null);
                  setPhone(t);
                }}
                keyboardType="phone-pad"
                placeholder="024 123 4567"
                placeholderTextColor={colors.grey300}
              />
            </View>
          </View>
        )}

        {step === 'otp' && (
          <View>
            <Text style={styles.heading}>Enter verification code</Text>
            <Text style={styles.subheading}>
              Sent via SMS to {phone || '+233 24 123 4567'}.
            </Text>

            <Text style={styles.label}>6-DIGIT CODE</Text>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={(t) => {
                setError(null);
                setOtp(t.replace(/\D/g, ''));
              }}
              keyboardType="numeric"
              maxLength={6}
              placeholder="123456"
              placeholderTextColor={colors.grey300}
            />
          </View>
        )}

        {step === 'profile' && (
          <View>
            <Text style={styles.heading}>Complete your profile</Text>
            <Text style={styles.subheading}>
              Tell us who we are hauling for so your consignment notes are formatted properly.
            </Text>

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeCard, accountType === 'individual' && styles.typeCardActive]}
                onPress={() => setAccountType('individual')}
              >
                <Feather
                  name="user"
                  size={18}
                  color={accountType === 'individual' ? colors.safetyAmber : colors.asphalt}
                />
                <Text style={[styles.typeTitle, accountType === 'individual' && { color: colors.roadWhite }]}>
                  Individual
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeCard, accountType === 'company' && styles.typeCardActive]}
                onPress={() => setAccountType('company')}
              >
                <Feather
                  name="briefcase"
                  size={18}
                  color={accountType === 'company' ? colors.safetyAmber : colors.asphalt}
                />
                <Text style={[styles.typeTitle, accountType === 'company' && { color: colors.roadWhite }]}>
                  Company
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>FULL NAME *</Text>
            <TextInput
              style={[styles.input, { marginBottom: spacing[3] }]}
              value={name}
              onChangeText={(t) => {
                setError(null);
                setName(t);
              }}
              placeholder="e.g. Samuel Mensah"
              placeholderTextColor={colors.grey300}
            />

            {accountType === 'company' && (
              <View>
                <Text style={styles.label}>COMPANY NAME *</Text>
                <TextInput
                  style={styles.input}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="e.g. Mensah Civil Works Ltd"
                  placeholderTextColor={colors.grey300}
                />
              </View>
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            if (step === 'phone') {
              if (phone.replace(/\D/g, '').length < 9) {
                setError('Please enter a valid Ghana phone number.');
                return;
              }
              setStep('otp');
            } else if (step === 'otp') {
              if (otp.length !== 6) {
                setError('Please enter the 6-digit verification code.');
                return;
              }
              setStep('profile');
            } else {
              if (!name.trim()) {
                setError('Please enter your name.');
                return;
              }
              router.replace('/');
            }
          }}
        >
          <Text style={styles.primaryBtnText}>
            {step === 'phone'
              ? 'Send Verification Code'
              : step === 'otp'
              ? 'Verify Code'
              : 'Finish Setup'}
          </Text>
          <Feather name="arrow-right" size={18} color={colors.asphalt} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.roadWhite },
  topBar: {
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  backBtn: {
    width: touchTargets.min,
    height: touchTargets.min,
    justifyContent: 'center',
  },
  stepLabel: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 11,
    color: colors.gravelGrey,
  },
  content: { padding: spacing[5] },
  heading: {
    fontFamily: 'Archivo-Bold',
    fontSize: 24,
    color: colors.asphalt,
    marginBottom: spacing[1.5],
  },
  subheading: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 14,
    color: colors.gravelGrey,
    marginBottom: spacing[5],
    lineHeight: 20,
  },
  label: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 11,
    color: colors.gravelGrey,
    letterSpacing: 0.6,
    marginBottom: spacing[1.5],
  },
  phoneRow: { flexDirection: 'row', gap: spacing[2] },
  prefixBox: {
    height: 48,
    paddingHorizontal: spacing[3],
    backgroundColor: colors.waybillPaper,
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: radii.button,
    justifyContent: 'center',
  },
  prefixText: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 15,
    color: colors.asphalt,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.asphalt,
    borderRadius: radii.button,
    paddingHorizontal: spacing[3],
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 16,
    color: colors.asphalt,
  },
  otpInput: {
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.asphalt,
    borderRadius: radii.button,
    textAlign: 'center',
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 24,
    letterSpacing: 12,
    color: colors.asphalt,
  },
  typeRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[4] },
  typeCard: {
    flex: 1,
    padding: spacing[4],
    backgroundColor: colors.waybillPaper,
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: radii.card,
    gap: spacing[2],
  },
  typeCardActive: {
    backgroundColor: colors.asphalt,
    borderColor: colors.asphalt,
  },
  typeTitle: {
    fontFamily: 'Archivo-Bold',
    fontSize: 15,
    color: colors.asphalt,
  },
  errorBox: {
    backgroundColor: colors.redLight,
    padding: spacing[3],
    borderRadius: radii.button,
    marginTop: spacing[3],
  },
  errorText: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 13,
    color: colors.rustRed,
  },
  footer: {
    padding: spacing[4],
    paddingBottom: spacing[6],
    backgroundColor: colors.waybillPaper,
    borderTopWidth: 1,
    borderTopColor: colors.grey200,
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
    fontSize: 16,
    color: colors.asphalt,
  },
});
