/**
 * Vagrova Customer App — Quote & Consignment Note Confirmation
 *
 * Step 5 of the booking flow:
 * - Displays the official Vagrova Waybill / Consignment Note
 * - Transparent price breakdown in GHS (Base, distance, tonnage, loading/offloading, oversized permit)
 * - Required deposit vs balance payable upon delivery
 * - Actions: Accept & Pay MoMo Deposit, Ask Question (call/chat), Decline
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radii, touchTargets } from '../design/tokens';

const CALL_CENTER_NUMBER = 'tel:+233302000000';

export default function QuoteConfirmationScreen() {
  const params = useLocalSearchParams();
  const requestId = (params.requestId as string) || 'VGJ-004829';
  const vehicle = (params.vehicleType as string) || 'Lowbed Transporter';
  const from = (params.pickupAddress as string) || 'Tema Port, Terminal 3';
  const to = (params.deliveryAddress as string) || 'Spintex Road, Heavy Industrial';

  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'bank' | 'cash'>('momo');
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'telecel' | 'at'>('mtn');

  const totalGHS = 6850;
  const depositGHS = 3425; // 50% deposit
  const balanceGHS = 3425;

  const handleAcceptAndPay = () => {
    // In production, triggers Paystack / Hubtel Mobile Money USSD prompt or card flow
    router.push({
      pathname: '/jobs/tracking',
      params: {
        jobId: requestId,
        status: 'booked',
      },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.asphalt} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Consignment Note</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Quotation Ready</Text>
        <Text style={styles.subheading}>
          Formal pricing breakdown based on cargo dimensions, route, and equipment.
        </Text>

        {/* ─── VAGROVA SIGNATURE CONSIGNMENT NOTE ─── */}
        <View style={styles.consignmentCard}>
          {/* Header Band */}
          <View style={styles.consignmentHeader}>
            <View>
              <Text style={styles.consignmentBrand}>VAGROVA FREIGHT & HEAVY HAULAGE</Text>
              <Text style={styles.consignmentJobId}>{requestId}</Text>
            </View>
            <View style={styles.stampBadge}>
              <Text style={styles.stampBadgeText}>QUOTATION</Text>
            </View>
          </View>

          {/* Key-Value Form Grid */}
          <View style={styles.gridRow}>
            <View style={[styles.gridCell, styles.cellBorderRight]}>
              <Text style={styles.cellLabel}>VEHICLE ALLOCATION</Text>
              <Text style={styles.cellValueBold}>{vehicle}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.cellLabel}>ESTIMATED WEIGHT</Text>
              <Text style={styles.cellValue}>24.0 Tonnes (Plant)</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.gridCell, styles.cellBorderRight]}>
              <Text style={styles.cellLabel}>PICKUP LOCATION</Text>
              <Text style={styles.cellValue}>{from}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.cellLabel}>DESTINATION</Text>
              <Text style={styles.cellValue}>{to}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.gridCell, styles.cellBorderRight]}>
              <Text style={styles.cellLabel}>ESTIMATED DISTANCE</Text>
              <Text style={styles.cellValue}>28.5 km</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.cellLabel}>VALIDITY PERIOD</Text>
              <Text style={styles.cellValue}>48 Hours</Text>
            </View>
          </View>

          {/* Pricing itemization */}
          <View style={styles.priceSection}>
            <Text style={styles.priceSectionTitle}>PRICE BREAKDOWN</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceItemName}>Base Heavy Equipment Rate</Text>
              <Text style={styles.priceItemAmount}>GHS 2,800.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceItemName}>Distance & Tonnage Fee (28.5 km @ 24t)</Text>
              <Text style={styles.priceItemAmount}>GHS 2,250.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceItemName}>Site Offloading Logistics Allowance</Text>
              <Text style={styles.priceItemAmount}>GHS 1,200.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceItemName}>Oversized Safety & Securing Escort</Text>
              <Text style={styles.priceItemAmount}>GHS 600.00</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL QUOTED AMOUNT</Text>
              <Text style={styles.totalAmount}>GHS {totalGHS.toLocaleString()}.00</Text>
            </View>

            <View style={styles.depositRow}>
              <View>
                <Text style={styles.depositLabel}>Initial Deposit Due Now</Text>
                <Text style={styles.depositSub}>Dispatches truck to your site</Text>
              </View>
              <Text style={styles.depositAmount}>GHS {depositGHS.toLocaleString()}.00</Text>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Balance Payable on Delivery</Text>
              <Text style={styles.balanceAmount}>GHS {balanceGHS.toLocaleString()}.00</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Selector */}
        <Text style={styles.sectionHeading}>Select Deposit Payment Method</Text>

        <View style={styles.paymentMethodsWrap}>
          <TouchableOpacity
            style={[styles.payMethodOption, paymentMethod === 'momo' && styles.payMethodOptionSelected]}
            onPress={() => setPaymentMethod('momo')}
            activeOpacity={0.8}
          >
            <Text style={styles.payMethodIcon}>📱</Text>
            <Text style={styles.payMethodText}>Mobile Money</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payMethodOption, paymentMethod === 'bank' && styles.payMethodOptionSelected]}
            onPress={() => setPaymentMethod('bank')}
            activeOpacity={0.8}
          >
            <Text style={styles.payMethodIcon}>🏦</Text>
            <Text style={styles.payMethodText}>Bank Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payMethodOption, paymentMethod === 'cash' && styles.payMethodOptionSelected]}
            onPress={() => setPaymentMethod('cash')}
            activeOpacity={0.8}
          >
            <Text style={styles.payMethodIcon}>💵</Text>
            <Text style={styles.payMethodText}>Cash via Vagrova</Text>
          </TouchableOpacity>
        </View>

        {paymentMethod === 'momo' && (
          <View style={styles.momoProvidersRow}>
            <TouchableOpacity
              style={[styles.providerPill, momoProvider === 'mtn' && styles.providerPillActive]}
              onPress={() => setMomoProvider('mtn')}
            >
              <Text style={styles.providerText}>MTN MoMo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerPill, momoProvider === 'telecel' && styles.providerPillActive]}
              onPress={() => setMomoProvider('telecel')}
            >
              <Text style={styles.providerText}>Telecel Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerPill, momoProvider === 'at' && styles.providerPillActive]}
              onPress={() => setMomoProvider('at')}
            >
              <Text style={styles.providerText}>AT Money</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryPayBtn}
          onPress={handleAcceptAndPay}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryPayBtnText}>
            Accept & Pay Deposit GHS {depositGHS.toLocaleString()}.00 →
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => Linking.openURL(CALL_CENTER_NUMBER)}
          >
            <Text style={styles.outlineBtnText}>💬 Ask Question</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/')}>
            <Text style={[styles.outlineBtnText, { color: colors.rustRed }]}>Decline Quote</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Call Vagrova bar */}
      <TouchableOpacity
        style={styles.callVagrovaBar}
        onPress={() => Linking.openURL(CALL_CENTER_NUMBER)}
        activeOpacity={0.9}
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

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingBottom: 90 },

  heading: { fontFamily: 'Archivo-Bold', fontSize: 22, color: colors.asphalt, marginBottom: spacing[1] },
  subheading: { fontFamily: 'IBMPlexSans-Regular', fontSize: 14, color: colors.gravelGrey, marginBottom: spacing[4] },

  // Consignment note card
  consignmentCard: {
    backgroundColor: colors.roadWhite,
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: radii.card,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  consignmentHeader: {
    backgroundColor: colors.asphalt,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consignmentBrand: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.8,
  },
  consignmentJobId: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 16,
    color: colors.safetyAmber,
    letterSpacing: 0.5,
  },
  stampBadge: {
    borderWidth: 1.5,
    borderColor: colors.safetyAmber,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    transform: [{ rotate: '-4deg' }],
  },
  stampBadgeText: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 10,
    color: colors.safetyAmber,
    letterSpacing: 1,
  },

  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  gridCell: {
    flex: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
  },
  cellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: colors.grey200,
  },
  cellLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 9,
    color: colors.gravelGrey,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cellValue: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 13,
    color: colors.asphalt,
  },
  cellValueBold: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 13,
    color: colors.asphalt,
  },

  // Pricing itemization
  priceSection: {
    padding: spacing[3],
    backgroundColor: colors.grey100,
  },
  priceSectionTitle: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.gravelGrey,
    marginBottom: spacing[2],
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceItemName: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 12,
    color: colors.asphalt,
  },
  priceItemAmount: {
    fontFamily: 'IBMPlexMono-Regular',
    fontSize: 12,
    color: colors.asphalt,
  },
  divider: {
    height: 1,
    backgroundColor: colors.grey300,
    marginVertical: spacing[2],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  totalLabel: {
    fontFamily: 'Archivo-Bold',
    fontSize: 13,
    color: colors.asphalt,
  },
  totalAmount: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 16,
    color: colors.asphalt,
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF5D6',
    padding: spacing[2],
    borderRadius: radii.button,
    marginBottom: 4,
  },
  depositLabel: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 12,
    color: '#7A5300',
  },
  depositSub: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 10,
    color: colors.gravelGrey,
  },
  depositAmount: {
    fontFamily: 'IBMPlexMono-Bold',
    fontSize: 14,
    color: '#7A5300',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingTop: 4,
  },
  balanceLabel: {
    fontFamily: 'IBMPlexSans-Regular',
    fontSize: 11,
    color: colors.gravelGrey,
  },
  balanceAmount: {
    fontFamily: 'IBMPlexMono-Medium',
    fontSize: 12,
    color: colors.gravelGrey,
  },

  // Payment method
  sectionHeading: {
    fontFamily: 'Archivo-Bold',
    fontSize: 15,
    color: colors.asphalt,
    marginBottom: spacing[2],
  },
  paymentMethodsWrap: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  payMethodOption: {
    flex: 1,
    backgroundColor: colors.roadWhite,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.button,
    padding: spacing[2],
    alignItems: 'center',
  },
  payMethodOptionSelected: {
    borderColor: colors.asphalt,
    backgroundColor: colors.asphalt,
  },
  payMethodIcon: { fontSize: 20, marginBottom: 4 },
  payMethodText: {
    fontFamily: 'IBMPlexSans-Medium',
    fontSize: 11,
    color: colors.asphalt,
  },

  momoProvidersRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  providerPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: radii.button,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.roadWhite,
  },
  providerPillActive: {
    borderColor: colors.safetyAmber,
    backgroundColor: '#FFF5D6',
  },
  providerText: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 12,
    color: colors.asphalt,
  },

  primaryPayBtn: {
    backgroundColor: colors.safetyAmber,
    borderRadius: radii.button,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  primaryPayBtnText: {
    fontFamily: 'Archivo-Bold',
    fontSize: 15,
    color: colors.asphalt,
    letterSpacing: 0.3,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: radii.button,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.roadWhite,
  },
  outlineBtnText: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 13,
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
  callVagrovaText: { fontFamily: 'Archivo-Bold', fontSize: 14, color: colors.asphalt, letterSpacing: 0.6 },
});

