import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
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
import { cloudinaryService } from '../../services/cloudinaryService';
import { useAuth } from '../../hooks/useAuth';
import { useDriver } from '../../hooks/useDriver';

type Props = NativeStackScreenProps<RootStackParamList, 'LicenseVerification'>;

export const LicenseVerificationScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { driverProfile, licenseVerification, verifyDriverLicense, isLoadingDriver } = useDriver();

  const existingLicenseNumber =
    licenseVerification?.licenseNumber ||
    (driverProfile?.licenseNumber && !driverProfile.licenseNumber.startsWith('PENDING-')
      ? driverProfile.licenseNumber
      : '');

  const [licenseNumber, setLicenseNumber] = useState(existingLicenseNumber);
  const [expiryDate, setExpiryDate] = useState(
    licenseVerification?.expiryDate || driverProfile?.licenseExpiryDate || ''
  );
  const [frontImageUri, setFrontImageUri] = useState<string>(
    licenseVerification?.frontImageUrl || driverProfile?.licenseFrontImageUrl || ''
  );
  const [backImageUri, setBackImageUri] = useState<string>(
    licenseVerification?.backImageUrl || driverProfile?.licenseBackImageUrl || ''
  );

  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
          Alert.alert('Permission Required', 'Photo library access is needed to select your license.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 10],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 10],
            quality: 0.8,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
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
      errs.licenseNumber = 'Driving license number is required (e.g., B1234567)';
    }
    if (!expiryDate.trim()) {
      errs.expiryDate = 'Expiry date is required (e.g., 2030-12-31)';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate.trim())) {
      errs.expiryDate = 'Please enter date in YYYY-MM-DD format (e.g., 2030-12-31)';
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

      // 1. Upload Front Photo to Cloudinary (swsqjk22) if it's a local URI
      let frontCloudUrl = frontImageUri;
      if (!frontImageUri.startsWith('http')) {
        setUploadStatus('Uploading Front License Photo to Cloudinary...');
        const frontRes = await cloudinaryService.uploadLicenseImage(
          frontImageUri,
          'front',
          driverRef
        );
        frontCloudUrl = frontRes.secureUrl;
      }

      // 2. Upload Back Photo to Cloudinary (swsqjk22) if it's a local URI
      let backCloudUrl = backImageUri;
      if (!backImageUri.startsWith('http')) {
        setUploadStatus('Uploading Back License Photo to Cloudinary...');
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
        'Your driving license details and photos have been uploaded to Cloudinary and saved.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert(
        'Verification Failed',
        err?.message || 'Could not upload license photos. Please check your connection and try again.'
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
                Upload clear photos of the front and back of your valid driving license. Images are securely stored via Cloudinary (`swsqjk22`).
              </Text>
            </View>
          </View>
        </Card>

        {/* License Number & Expiry Date */}
        <Text style={styles.sectionTitle}>1. License Details</Text>
        <Input
          label="Driving License Number"
          placeholder="B1234567"
          value={licenseNumber}
          onChangeText={(val) => {
            setLicenseNumber(val);
            if (errors.licenseNumber) setErrors((prev) => ({ ...prev, licenseNumber: '' }));
          }}
          autoCapitalize="characters"
          error={errors.licenseNumber}
          leftIcon={<Ionicons name="card-outline" size={20} color={Colors.textMuted} />}
        />

        <Input
          label="License Expiry Date (YYYY-MM-DD)"
          placeholder="2030-12-31"
          value={expiryDate}
          onChangeText={(val) => {
            setExpiryDate(val);
            if (errors.expiryDate) setErrors((prev) => ({ ...prev, expiryDate: '' }));
          }}
          keyboardType="numbers-and-punctuation"
          error={errors.expiryDate}
          leftIcon={<Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />}
        />

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
                  <Ionicons name="camera-outline" size={26} color={Colors.primary} />
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
              : 'Upload & Verify Driver License'
          }
          onPress={handleSubmitVerification}
          loading={uploading || isLoadingDriver}
          icon={<Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />}
          style={styles.submitBtn}
        />
      </ScrollView>
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
});
