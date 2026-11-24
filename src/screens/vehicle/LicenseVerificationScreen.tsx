import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { isValidSriLankanLicenseNumber } from '../../utils/validators';
import { cloudinaryService } from '../../services/cloudinaryService';
import { useAuth } from '../../hooks/useAuth';
import { useDriver } from '../../hooks/useDriver';

type Props = NativeStackScreenProps<RootStackParamList, 'LicenseVerification'>;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatYmd = (year: number, monthIndex: number, day: number): string => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const formatReadableDate = (ymd: string): string => {
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(monthIdx) || isNaN(day) || !MONTH_NAMES[monthIdx]) return ymd;
  return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
};

export const LicenseVerificationScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { driverProfile, licenseVerification, verifyDriverLicense, isLoadingDriver } = useDriver();

  const existingLicenseNumber =
    licenseVerification?.licenseNumber ||
    (driverProfile?.licenseNumber && !driverProfile.licenseNumber.startsWith('PENDING-')
      ? driverProfile.licenseNumber
      : '');

  const initialExpiry =
    licenseVerification?.expiryDate || driverProfile?.licenseExpiryDate || '';

  const [licenseNumber, setLicenseNumber] = useState(existingLicenseNumber);
  const [expiryDate, setExpiryDate] = useState(initialExpiry);
  const [frontImageUri, setFrontImageUri] = useState<string>(
    licenseVerification?.frontImageUrl || driverProfile?.licenseFrontImageUrl || ''
  );
  const [backImageUri, setBackImageUri] = useState<string>(
    licenseVerification?.backImageUrl || driverProfile?.licenseBackImageUrl || ''
  );

  // Calendar Modal state
  const now = new Date();
  const parsedInitial = useMemo(() => {
    if (initialExpiry && /^\d{4}-\d{2}-\d{2}$/.test(initialExpiry)) {
      const [y, m, d] = initialExpiry.split('-').map((n) => parseInt(n, 10));
      return { year: y, month: m - 1, day: d };
    }
    return {
      year: now.getFullYear() + 4,
      month: now.getMonth(),
      day: now.getDate(),
    };
  }, [initialExpiry]);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(parsedInitial.year);
  const [calMonth, setCalMonth] = useState(parsedInitial.month);
  const [calDay, setCalDay] = useState(parsedInitial.day);

  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Build calendar cells for current calYear & calMonth
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return { cells, daysInMonth };
  }, [calYear, calMonth]);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleConfirmCalendarDate = () => {
    const safeDay = Math.min(calDay, calendarDays.daysInMonth);
    const formatted = formatYmd(calYear, calMonth, safeDay);
    setExpiryDate(formatted);
    setErrors((prev) => ({ ...prev, expiryDate: '' }));
    setShowCalendar(false);
  };

  const pickLicenseImage = async (side: 'front' | 'back', useCamera: boolean = false) => {
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Camera access is needed to photograph your license.');
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Permission Required',
            'Photo library access is needed to select your license.'
          );
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 10],
            quality: 0.75,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 10],
            quality: 0.75,
            base64: true,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        if (side === 'front') {
          setFrontImageUri(uri);
          setErrors((prev) => ({ ...prev, frontImage: '' }));
        } else {
          setBackImageUri(uri);
          setErrors((prev) => ({ ...prev, backImage: '' }));
        }
      }
    } catch (error: any) {
      Alert.alert('Image Selection Error', error?.message || 'Could not select image.');
    }
  };

  const promptImageSource = (side: 'front' | 'back') => {
    Alert.alert(
      `Select License Photo (${side === 'front' ? 'Front' : 'Back'})`,
      'Choose how you want to add your driving license photo',
      [
        { text: 'Take Photo (Camera)', onPress: () => pickLicenseImage(side, true) },
        { text: 'Choose from Gallery', onPress: () => pickLicenseImage(side, false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!licenseNumber.trim()) {
      errs.licenseNumber = 'Driving license number is required (e.g., B5571555)';
    } else if (!isValidSriLankanLicenseNumber(licenseNumber)) {
      errs.licenseNumber =
        'License number must start with a letter followed by 7 digits (e.g., B5571555)';
    }
    if (!expiryDate.trim()) {
      errs.expiryDate = 'Please select your license expiry date from the calendar';
    }
    if (!frontImageUri) {
      errs.frontImage = 'Front photo of your driving license is required';
    }
    if (!backImageUri) {
      errs.backImage = 'Back photo of your driving license is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitVerification = async () => {
    if (!validate()) return;

    setUploading(true);
    try {
      const driverRef = driverProfile?.id || user?.id || String(Date.now());

      let frontCloudUrl = frontImageUri;
      if (!frontImageUri.startsWith('http')) {
        setUploadStatus('Uploading Front License Photo...');
        const frontRes = await cloudinaryService.uploadLicenseImage(
          frontImageUri,
          'front',
          driverRef
        );
        frontCloudUrl = frontRes.secureUrl;
      }

      let backCloudUrl = backImageUri;
      if (!backImageUri.startsWith('http')) {
        setUploadStatus('Uploading Back License Photo...');
        const backRes = await cloudinaryService.uploadLicenseImage(
          backImageUri,
          'back',
          driverRef
        );
        backCloudUrl = backRes.secureUrl;
      }

      setUploadStatus('Saving verification details...');
      await verifyDriverLicense({
        licenseNumber: licenseNumber.trim().toUpperCase(),
        expiryDate: expiryDate.trim(),
        frontImageUrl: frontCloudUrl,
        backImageUrl: backCloudUrl,
      });

      Alert.alert(
        'Driver License Verified',
        'Your driving license details and photos have been uploaded.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert(
        'Verification Failed',
        err?.message ||
          'Could not upload license photos. Please check your connection and try again.'
      );
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  return (
    <SafeScreen>
      <AppHeader title="Verify Driver's License" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Info Banner */}
        <Card style={styles.infoBanner}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Sri Lanka Driving License Verification</Text>
              <Text style={styles.infoSub}>
                Upload clear photos of the front and back of your valid driving license.
              </Text>
            </View>
          </View>
        </Card>

        {/* License Number & Calendar Expiry Date */}
        <Text style={styles.sectionTitle}>1. License Details</Text>
        <Input
          label="Driving License Number"
          placeholder="B5571555"
          value={licenseNumber}
          onChangeText={(val) => {
            const formatted = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
            setLicenseNumber(formatted);
            if (errors.licenseNumber) setErrors((prev) => ({ ...prev, licenseNumber: '' }));
          }}
          autoCapitalize="characters"
          maxLength={8}
          error={errors.licenseNumber}
          leftIcon={<Ionicons name="card-outline" size={20} color={Colors.textMuted} />}
        />

        {/* Calendar Picker Trigger Field */}
        <View style={styles.dateFieldContainer}>
          <Text style={styles.photoLabel}>LICENSE EXPIRY DATE</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.dateSelectorBtn,
              errors.expiryDate ? styles.uploadBoxError : null,
            ]}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            <Text
              style={[
                styles.dateSelectorText,
                !expiryDate && { color: Colors.textMuted },
              ]}
            >
              {expiryDate ? formatReadableDate(expiryDate) : 'Tap to select expiry date'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          {errors.expiryDate ? <Text style={styles.errorText}>{errors.expiryDate}</Text> : null}
        </View>

        {/* Front & Back License Photos */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
          2. License Photos (Front & Back)
        </Text>

        {/* Front Photo Card */}
        <View style={styles.photoBlock}>
          <Text style={styles.photoLabel}>DRIVING LICENSE — FRONT SIDE</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.uploadBox,
              errors.frontImage ? styles.uploadBoxError : null,
            ]}
            onPress={() => promptImageSource('front')}
          >
            {frontImageUri ? (
              <View style={styles.previewWrapper}>
                <Image source={{ uri: frontImageUri }} style={styles.previewImage} />
                <View style={styles.changeOverlay}>
                  <Ionicons name="camera" size={16} color={Colors.white} />
                  <Text style={styles.changeOverlayText}>Tap to Change Front Photo</Text>
                </View>
              </View>
            ) : (
              <View style={styles.placeholderContent}>
                <View style={styles.iconCircle}>
                  <Ionicons name="images-outline" size={26} color={Colors.primary} />
                </View>
                <Text style={styles.uploadTitle}>Add License Front Photo</Text>
                <Text style={styles.uploadHint}>
                  Make sure your photo, name, and license number are clearly visible
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.frontImage ? <Text style={styles.errorText}>{errors.frontImage}</Text> : null}
        </View>

        {/* Back Photo Card */}
        <View style={styles.photoBlock}>
          <Text style={styles.photoLabel}>DRIVING LICENSE — BACK SIDE</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.uploadBox,
              errors.backImage ? styles.uploadBoxError : null,
            ]}
            onPress={() => promptImageSource('back')}
          >
            {backImageUri ? (
              <View style={styles.previewWrapper}>
                <Image source={{ uri: backImageUri }} style={styles.previewImage} />
                <View style={styles.changeOverlay}>
                  <Ionicons name="camera" size={16} color={Colors.white} />
                  <Text style={styles.changeOverlayText}>Tap to Change Back Photo</Text>
                </View>
              </View>
            ) : (
              <View style={styles.placeholderContent}>
                <View style={styles.iconCircle}>
                  <Ionicons name="images-outline" size={26} color={Colors.primary} />
                </View>
                <Text style={styles.uploadTitle}>Add License Back Photo</Text>
                <Text style={styles.uploadHint}>
                  Make sure vehicle classes and expiry date on the back are legible
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.backImage ? <Text style={styles.errorText}>{errors.backImage}</Text> : null}
        </View>

        {uploadStatus ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>{uploadStatus}</Text>
          </View>
        ) : null}

        <Button
          title={
            licenseVerification?.isVerified
              ? 'Update Verified License'
              : 'Upload Driving License'
          }
          onPress={handleSubmitVerification}
          loading={uploading || isLoadingDriver}
          icon={<Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />}
          style={styles.submitBtn}
        />
      </ScrollView>

      {/* Calendar Picker Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarTopBar}>
              <Text style={styles.calendarModalTitle}>Select Expiry Date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Year Selector Stepper */}
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepIconBtn}
                onPress={() => setCalYear((y) => Math.max(now.getFullYear(), y - 1))}
              >
                <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepperYearText}>Year: {calYear}</Text>
              <TouchableOpacity
                style={styles.stepIconBtn}
                onPress={() => setCalYear((y) => y + 1)}
              >
                <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Month Selector Stepper */}
            <View style={styles.monthBar}>
              <TouchableOpacity style={styles.stepIconBtn} onPress={handlePrevMonth}>
                <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.monthTitleText}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity style={styles.stepIconBtn} onPress={handleNextMonth}>
                <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Weekday Headers */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((wd) => (
                <Text key={wd} style={styles.weekdayLabel}>
                  {wd}
                </Text>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.daysGrid}>
              {calendarDays.cells.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <View key={`empty-${idx}`} style={styles.dayCell} />;
                }
                const selected = dayNum === Math.min(calDay, calendarDays.daysInMonth);
                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[styles.dayCell, selected && styles.dayCellSelected]}
                    onPress={() => setCalDay(dayNum)}
                  >
                    <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <Button
                title="Cancel"
                variant="outline"
                size="medium"
                onPress={() => setShowCalendar(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Date"
                variant="primary"
                size="medium"
                onPress={handleConfirmCalendarDate}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  infoBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoTitle: {
    ...Typography.bodyBold,
    color: '#166534',
  },
  infoSub: {
    ...Typography.caption,
    color: '#15803D',
    marginTop: 2,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  dateFieldContainer: {
    marginBottom: 16,
  },
  dateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    minHeight: 52,
    gap: 10,
  },
  dateSelectorText: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  photoBlock: {
    marginBottom: 18,
  },
  photoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  uploadBox: {
    height: 175,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxError: {
    borderColor: Colors.danger,
  },
  placeholderContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  uploadHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  previewWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeOverlayText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
  statusBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statusBannerText: {
    ...Typography.caption,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 28,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calendarTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarModalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  stepperYearText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthTitleText: {
    ...Typography.bodyBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  stepIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  calendarActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
