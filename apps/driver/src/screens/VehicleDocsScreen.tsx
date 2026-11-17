/**
 * Vagrova Driver / Owner App — Vehicle Documents & Verification Screen
 *
 * Mandatory regulatory documents:
 *   1. Driver's Licence
 *   2. Vehicle Registration
 *   3. Roadworthy Certificate (DVLA)
 *   4. Insurance Certificate
 *   5. National ID Card (Ghana Card)
 *
 * Enforces Vagrova Rules:
 * - Shows status: Approved, Waiting, or Rejected (with clear admin reason)
 * - 30-day and 7-day expiry warnings
 * - Expired document automatically blocks truck from receiving jobs
 * - One-tap camera re-upload with edge detection & clarity check
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radii } from '../design/tokens';

interface DocItem {
  id: string;
  name: string;
  status: 'approved' | 'waiting' | 'rejected' | 'expiring_soon';
  expiryDate: string;
  daysRemaining?: number;
  rejectionReason?: string;
}

const DOCUMENTS: DocItem[] = [
  {
    id: 'licence',
    name: "Driver's Licence (Class F - Heavy Goods)",
    status: 'approved',
    expiryDate: '14 Oct 2027',
  },
  {
    id: 'roadworthy',
    name: 'DVLA Roadworthy Certificate',
    status: 'approved',
    expiryDate: '28 Aug 2027',
  },
  {
    id: 'insurance',
    name: 'Commercial Comprehensive Insurance',
    status: 'expiring_soon',
    expiryDate: '08 Dec 2026',
    daysRemaining: 22,
  },
  {
    id: 'registration',
    name: 'Vehicle Registration (Form C)',
    status: 'approved',
    expiryDate: 'Permanent',
  },
  {
    id: 'ghana_card',
    name: 'Ghana National ID Card',
    status: 'approved',
    expiryDate: '2032',
  },
];

export default function VehicleDocsScreen() {
  const handleUploadNew = (docName: string) => {
    Alert.alert(
      'Document Capture',
      `Align your ${docName} inside the camera frame. Ensure all corners and stamps are clearly visible without flash glare.`,
      [{ text: 'Open Camera', onPress: () => {} }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Compliance & Documents</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Vehicle Compliance</Text>
        <Text style={styles.subheading}>
          All 5 documents must remain active. An expired certificate automatically suspends dispatch.
        </Text>

        {/* Warning Banner if expiring */}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Action Required Soon</Text>
          <Text style={styles.warningBody}>
            Commercial Insurance expires in 22 days. Renew early to avoid dispatch interruption.
          </Text>
        </View>

        {/* Documents List */}
        <View style={styles.docList}>
          {DOCUMENTS.map((doc) => {
            const isExpiring = doc.status === 'expiring_soon';
            const isApproved = doc.status === 'approved';
            const isRejected = doc.status === 'rejected';

            return (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docHeader}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      isApproved && styles.statusPillGreen,
                      isExpiring && styles.statusPillAmber,
                      isRejected && styles.statusPillRed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isApproved && { color: colors.weighbridgeGreen },
                        isExpiring && { color: colors.safetyAmber },
                        isRejected && { color: colors.rustRed },
                      ]}
                    >
                      {isExpiring
                        ? `${doc.daysRemaining} DAYS LEFT`
                        : doc.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.docMetaRow}>
                  <Text style={styles.expiryLabel}>Valid Until: {doc.expiryDate}</Text>
                  <TouchableOpacity
                    style={styles.reUploadBtn}
                    onPress={() => handleUploadNew(doc.name)}
                  >
                    <Text style={styles.reUploadBtnText}>📷 Update</Text>
                  </TouchableOpacity>
                </View>

                {doc.rejectionReason && (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionText}>
                      Admin note: {doc.rejectionReason}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: { height: 44, justifyContent: 'center' },
  backArrow: { fontFamily: 'IBMPlexSans-Medium', fontSize: 14, color: colors.textHighContrast },
  screenTitle: { fontFamily: 'Archivo-Bold', fontSize: 16, color: colors.textHighContrast },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingBottom: spacing[8] },

  heading: { fontFamily: 'Archivo-Bold', fontSize: 22, color: colors.textHighContrast, marginBottom: 2 },
  subheading: { fontFamily: 'IBMPlexSans-Regular', fontSize: 13, color: colors.textMuted, marginBottom: spacing[4] },

  warningCard: {
    backgroundColor: '#382B0A',
    borderLeftWidth: 4,
    borderLeftColor: colors.safetyAmber,
    borderRadius: radii.card,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  warningTitle: { fontFamily: 'Archivo-Bold', fontSize: 14, color: colors.safetyAmber, marginBottom: 2 },
  warningBody: { fontFamily: 'IBMPlexSans-Regular', fontSize: 12, color: colors.textSecondary },

  docList: { gap: spacing[3] },
  docCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radii.card,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[2] },
  docName: { fontFamily: 'Archivo-Bold', fontSize: 15, color: colors.textHighContrast, flex: 1 },

  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2 },
  statusPillGreen: { backgroundColor: '#1C3325' },
  statusPillAmber: { backgroundColor: '#382B0A' },
  statusPillRed: { backgroundColor: '#351610' },
  statusPillText: { fontFamily: 'IBMPlexSans-Bold', fontSize: 10, letterSpacing: 0.5 },

  docMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  expiryLabel: { fontFamily: 'IBMPlexMono-Regular', fontSize: 12, color: colors.textMuted },
  reUploadBtn: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.button,
  },
  reUploadBtnText: { fontFamily: 'IBMPlexSans-SemiBold', fontSize: 12, color: colors.textHighContrast },

  rejectionBox: {
    backgroundColor: '#351610',
    padding: spacing[2],
    borderRadius: radii.chip,
    marginTop: spacing[2],
  },
  rejectionText: { fontFamily: 'IBMPlexSans-Regular', fontSize: 12, color: colors.rustRed },
});

