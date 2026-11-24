import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { cloudinaryService } from '../../services/cloudinaryService';
import { useAuth } from '../../hooks/useAuth';
import { useDriver } from '../../hooks/useDriver';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateProfile, updateUser, logout } = useAuth();
  const {
    driverProfile,
    vehicles,
    activeVehicle,
    licenseVerification,
    availabilityStatus,
    selectActiveVehicle,
  } = useDriver();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const profileImageUrl = user?.avatarUrl || user?.profile?.profilePictureUrl;

  const isLicenseVerified =
    Boolean(licenseVerification?.isVerified) ||
    Boolean(
      driverProfile?.licenseNumber &&
        !driverProfile.licenseNumber.startsWith('PENDING-') &&
        driverProfile.licenseFrontImageUrl
    );

  const verifiedLicenseNumber =
    licenseVerification?.licenseNumber ||
    (driverProfile?.licenseNumber && !driverProfile.licenseNumber.startsWith('PENDING-')
      ? driverProfile.licenseNumber
      : '');

  const verifiedExpiryDate =
    licenseVerification?.expiryDate || driverProfile?.licenseExpiryDate || '';

  const allVehicles =
    vehicles.length > 0
      ? vehicles
      : driverProfile?.vehicle
      ? [driverProfile.vehicle]
      : [];

  const handleQuickAvatarUpload = async (useCamera: boolean) => {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!perm.granted) {
        Alert.alert(
          'Permission Required',
          `Please grant ${useCamera ? 'camera' : 'photo library'} access to upload your profile photo.`
        );
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.75,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.75,
            base64: true,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const localUri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setUploadingAvatar(true);
        try {
          const uploadRes = await cloudinaryService.uploadProfileImage(localUri, user?.id);
          updateUser({
            avatarUrl: uploadRes.secureUrl,
            profile: {
              ...user?.profile,
              profilePictureUrl: uploadRes.secureUrl,
            },
          });
          await updateProfile({
            firstName: user?.firstName,
            lastName: user?.lastName,
            phoneNumber: user?.phoneNumber,
            profile: {
              ...user?.profile,
              profilePictureUrl: uploadRes.secureUrl,
            },
          });
          Alert.alert('Photo Updated', 'Your driver profile image has been saved to Cloudinary.');
        } catch {
          // Local avatar state already updated
        } finally {
          setUploadingAvatar(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message || 'Could not update profile photo.');
    }
  };

  const promptAvatarChange = () => {
    Alert.alert('Update Driver Profile Photo', 'Choose an option', [
      { text: 'Take Photo (Camera)', onPress: () => handleQuickAvatarUpload(true) },
      { text: 'Choose from Gallery', onPress: () => handleQuickAvatarUpload(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of YAMU Driver?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeScreen>
      <AppHeader title="Driver Account" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* 1. Driver Details Card */}
        <Card style={styles.profileCard}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.avatarContainer}
            onPress={promptAvatarChange}
            disabled={uploadingAvatar}
          >
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.fullName || 'D').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="camera" size={12} color={Colors.white} />
              )}
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.fullName || 'Driver Partner'}</Text>
            <Text style={styles.subText}>{user?.email || user?.phoneNumber}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.badge}>
                <Ionicons name="star" size={12} color={Colors.secondary} />
                <Text style={styles.badgeText}>
                  {(driverProfile?.rating ?? user?.rating ?? 5.0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{availabilityStatus}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* 2. Separate Driver's License Verification Card */}
        <Card style={styles.licenseCard}>
          <View style={styles.licenseInfoRow}>
            <View
              style={[
                styles.licenseIconCircle,
                isLicenseVerified ? styles.licenseIconVerified : styles.licenseIconPending,
              ]}
            >
              <Ionicons
                name={isLicenseVerified ? 'shield-checkmark' : 'id-card-outline'}
                size={22}
                color={isLicenseVerified ? Colors.success : Colors.secondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.licenseTitle}>Driver’s License Verification</Text>
              <Text style={styles.licenseSub}>
                {isLicenseVerified
                  ? `License: ${verifiedLicenseNumber}${
                      verifiedExpiryDate ? ` • Exp: ${verifiedExpiryDate}` : ''
                    }`
                  : 'Upload your driving license number, front & back photos, and expiry date'}
              </Text>
            </View>
          </View>

          <Button
            title={isLicenseVerified ? 'Verify Drivers License (Verified)' : 'Verify Drivers License'}
            variant={isLicenseVerified ? 'outline' : 'secondary'}
            size="medium"
            onPress={() => navigation.navigate('LicenseVerification')}
            icon={
              <Ionicons
                name={isLicenseVerified ? 'shield-checkmark' : 'card-outline'}
                size={18}
                color={isLicenseVerified ? Colors.primary : Colors.white}
              />
            }
          />
        </Card>

        {/* 3. Registered Vehicles Displayed as Separate Cards One by One */}
        <View style={styles.vehiclesSectionHeader}>
          <Text style={styles.sectionTitle}>
            Registered Vehicles ({allVehicles.length})
          </Text>
          <TouchableOpacity
            style={styles.addVehicleChip}
            onPress={() => navigation.navigate('VehicleManagement', { mode: 'add' })}
          >
            <Ionicons name="add-circle" size={18} color={Colors.primary} />
            <Text style={styles.addVehicleText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>

        {allVehicles.length === 0 ? (
          <Card style={styles.emptyVehicleCard}>
            <Ionicons name="car-sport-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyVehicleTitle}>No vehicles registered yet</Text>
            <Text style={styles.emptyVehicleSub}>
              Register your Tuk, Bike, Car, or Van to start accepting passenger trips.
            </Text>
            <Button
              title="Register a Vehicle"
              size="medium"
              onPress={() => navigation.navigate('VehicleManagement', { mode: 'add' })}
              style={{ marginTop: 8, width: '100%' }}
            />
          </Card>
        ) : (
          allVehicles.map((vehicle, index) => {
            const isCurrentActive =
              activeVehicle?.licensePlate?.toUpperCase() ===
                vehicle.licensePlate?.toUpperCase() ||
              (!activeVehicle && index === 0);

            return (
              <Card
                key={`${vehicle.licensePlate}-${index}`}
                style={[
                  styles.singleVehicleCard,
                  isCurrentActive && styles.singleVehicleCardActive,
                ]}
              >
                <View style={styles.vehicleTopRow}>
                  <View style={styles.vehicleTypeIconBox}>
                    <Ionicons name="car-sport" size={20} color={Colors.white} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleMain}>
                      {vehicle.make} {vehicle.model}
                    </Text>
                    <Text style={styles.vehicleMeta}>
                      Plate: {vehicle.licensePlate} • {vehicle.color}
                      {vehicle.year ? ` • ${vehicle.year}` : ''}
                    </Text>
                  </View>

                  <View style={styles.vehicleTypePill}>
                    <Text style={styles.vehicleTypePillText}>{vehicle.vehicleType}</Text>
                  </View>
                </View>

                <View style={styles.vehicleBottomRow}>
                  <TouchableOpacity
                    style={styles.activeToggleBtn}
                    onPress={() => selectActiveVehicle(vehicle.licensePlate)}
                  >
                    <Ionicons
                      name={isCurrentActive ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={isCurrentActive ? Colors.success : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.activeToggleText,
                        isCurrentActive && { color: Colors.success, fontWeight: '700' },
                      ]}
                    >
                      {isCurrentActive ? 'Active Vehicle' : 'Set as Active'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('VehicleManagement', { mode: 'manage' })}
                  >
                    <Text style={styles.editLink}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}

        {/* 4. Menu Actions */}
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="person-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuText}>Edit Personal Profile & Photo</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EmergencySupport')}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color={Colors.danger} />
            <Text style={styles.menuText}>Emergency & Roadside Support</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
            <Text style={[styles.menuText, { color: Colors.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.h1,
    color: Colors.white,
  },
  name: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  subText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  licenseCard: {
    gap: 14,
  },
  licenseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  licenseIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  licenseIconVerified: {
    backgroundColor: '#DCFCE7',
  },
  licenseIconPending: {
    backgroundColor: '#FEF3C7',
  },
  licenseTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  licenseSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vehiclesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  addVehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addVehicleText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  emptyVehicleCard: {
    alignItems: 'center',
    paddingVertical: 22,
    gap: 6,
  },
  emptyVehicleTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  emptyVehicleSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  singleVehicleCard: {
    gap: 12,
  },
  singleVehicleCardActive: {
    borderColor: Colors.success,
    borderWidth: 1.5,
  },
  vehicleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleTypeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleMain: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  vehicleMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vehicleTypePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vehicleTypePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  vehicleBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 10,
  },
  activeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeToggleText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  editLink: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  menuCard: {
    paddingVertical: 4,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  menuText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    flex: 1,
  },
});
