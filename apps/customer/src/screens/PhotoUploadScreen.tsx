/**
 * Vagrova Customer App — Photo Upload Screen
 *
 * Step 4 of the booking flow:
 * - Up to 8 photos from camera or gallery
 * - Mandatory for machinery and oversized loads
 * - Background upload resilient to network drops
 * - Clear guidance: "Show the whole load and where the truck must reach"
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

interface UploadItem {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
}

export default function PhotoUploadScreen() {
  const params = useLocalSearchParams();

  const [photos, setPhotos] = useState<UploadItem[]>([
    { id: '1', name: 'excavator_front_side.jpg', size: '1.4 MB', progress: 100, status: 'completed' },
    { id: '2', name: 'loading_access_road.jpg', size: '2.1 MB', progress: 100, status: 'completed' },
    { id: '3', name: 'attachment_bucket.jpg', size: '980 KB', progress: 75, status: 'uploading' },
  ]);

  const handleAddPhoto = () => {
    if (photos.length >= 8) return;
    const newId = String(photos.length + 1);
    setPhotos([
      ...photos,
      {
        id: newId,
        name: `load_perspective_${newId}.jpg`,
        size: '1.8 MB',
        progress: 20,
        status: 'uploading',
      },
    ]);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleSubmitRequest = () => {
    // Generate a temporary job request ID
    const sampleRequestId = 'VGJ-004829';
    router.push({
      pathname: '/book/quote-confirmation',
      params: {
        ...params,
        requestId: sampleRequestId,
        photoCount: String(photos.length),
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
        <Text style={styles.stepLabel}>Step 4 of 5</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '80%' }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Upload Cargo Photographs</Text>
        <Text style={styles.subheading}>
          Show the whole load and where the truck must reach to load/unload.
        </Text>

        {/* Guidance Notice */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>⚠️ Mandatory for Machinery & Oversized Items</Text>
          <Text style={styles.noticeBody}>
            Drivers and dispatchers inspect clearances, access roads, and tie-down points before sending an offer.
          </Text>
        </View>

        {/* Add photo action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.captureBtn} onPress={handleAddPhoto} activeOpacity={0.8}>
            <Text style={styles.captureIcon}>📷</Text>
            <Text style={styles.captureText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryBtn} onPress={handleAddPhoto} activeOpacity={0.8}>
            <Text style={styles.galleryIcon}>🖼️</Text>
            <Text style={styles.galleryText}>Choose Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Uploaded List & Status */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>ATTACHED PHOTOS ({photos.length}/8)</Text>
          <Text style={styles.resilienceHint}>Auto-resumes on poor network</Text>
        </View>

        <View style={styles.photosContainer}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoItem}>
              <View style={styles.photoThumbPlaceholder}>
                <Text style={{ fontSize: 20 }}>🏗️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoName} numberOfLines={1}>
                  {photo.name}
                </Text>
                <Text style={styles.photoMeta}>
                  {photo.size} ·{' '}
                  {photo.status === 'completed'
                    ? 'Uploaded ✓'
                    : `Uploading ${photo.progress}%`}
                </Text>
                {photo.status === 'uploading' && (
                  <View style={styles.progressMiniTrack}>
                    <View style={[styles.progressMiniFill, { width: `${photo.progress}%` }]} />
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleRemovePhoto(photo.id)}
                style={styles.removeBtn}
                accessibilityLabel="Remove photo"
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Submit Booking Request Button */}
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={handleSubmitRequest}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryActionBtnText}>Submit Request for Quotation →</Text>
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

  noticeBox: {
    backgroundColor: '#FFF5D6',
    borderLeftWidth: 4,
    borderLeftColor: colors.safetyAmber,
    padding: spacing[3],
    borderRadius: radii.chip,
    marginBottom: spacing[4],
  },
  noticeTitle: { fontFamily: 'Archivo-Bold', fontSize: 13, color: '#7A5300', marginBottom: 2 },
  noticeBody: { fontFamily: 'IBMPlexSans-Regular', fontSize: 12, color: colors.asphalt, lineHeight: 17 },

  actionsRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[4] },
  captureBtn: {
    flex: 1,
    backgroundColor: colors.asphalt,
    borderRadius: radii.button,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captureIcon: { fontSize: 18 },
  captureText: { fontFamily: 'IBMPlexSans-SemiBold', fontSize: 14, color: colors.roadWhite },
  galleryBtn: {
    flex: 1,
    backgroundColor: colors.roadWhite,
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: radii.button,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  galleryIcon: { fontSize: 18 },
  galleryText: { fontFamily: 'IBMPlexSans-SemiBold', fontSize: 14, color: colors.asphalt },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  listTitle: {
    fontFamily: 'IBMPlexSans-SemiBold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.gravelGrey,
  },
  resilienceHint: { fontFamily: 'IBMPlexSans-Regular', fontSize: 11, color: colors.weighbridgeGreen },

  photosContainer: {
    backgroundColor: colors.roadWhite,
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: radii.card,
    padding: spacing[2],
    marginBottom: spacing[4],
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  photoThumbPlaceholder: {
    width: 44,
    height: 44,
    backgroundColor: colors.grey100,
    borderRadius: radii.chip,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoName: { fontFamily: 'IBMPlexSans-Medium', fontSize: 13, color: colors.asphalt },
  photoMeta: { fontFamily: 'IBMPlexMono-Regular', fontSize: 11, color: colors.gravelGrey, marginTop: 2 },
  progressMiniTrack: { height: 3, backgroundColor: colors.grey100, marginTop: 4, borderRadius: 2 },
  progressMiniFill: { height: 3, backgroundColor: colors.safetyAmber, borderRadius: 2 },
  removeBtn: { padding: spacing[2] },
  removeBtnText: { color: colors.rustRed, fontSize: 16, fontWeight: '700' },

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

