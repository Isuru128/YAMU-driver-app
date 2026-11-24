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
  const { driverProfile, activeVehicle, licenseVerification, availabilityStatus } = useDriver();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const profileImageUrl = user?.avatarUrl || user?.profile?.profilePictureUrl;

  const isLicenseVerified =
    Boolean(licenseVerification?.isVerified) ||
    Boolean(
      driverProfile?.licenseNumber &&
        !driverProfile.licenseNumber.startsWith('PENDING-') &&
        driverProfile.licenseFrontImageUrl
    );

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
        const localUri = result.assets[0].uri;
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

  const currentVehicle = activeVehicle || driverProfile?.vehicle;

  return (
    <SafeScreen>
      <AppHeader title="Driver Account" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Driver Header Card with Uploadable Profile Photo */}
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
                  {(driverProfile?.rating ?? user?.rating ?? 4.95).toFixed(2)}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{availabilityStatus}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Vehicle Summary Card */}
        <Card style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <Text style={styles.sectionTitle}>Assigned Vehicle</Text>
            <TouchableOpacity onPress={() => navigation.navigate('VehicleManagement')}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          {currentVehicle ? (
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleMain}>
                {currentVehicle.make} {currentVehicle.model} ({currentVehicle.vehicleType})
              </Text>
              <Text style={styles.vehicleMeta}>
                Plate: {currentVehicle.licensePlate} • Color: {currentVehicle.color}
              </Text>
              <Text style={styles.vehicleMeta}>
                Service Area: {driverProfile?.serviceArea || 'Colombo'}
              </Text>
            </View>
          ) : (
            <Text style={styles.vehicleMeta}>
              No vehicle registered yet. Tap Edit to configure your vehicle.
            </Text>
          )}

          <Button
            title={isLicenseVerified ? "Driver's License Verified" : "Verify Drivers License"}
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
            style={{ marginTop: 10 }}
          />
        </Card>

        {/* Menu Actions */}
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('LicenseVerification')}
          >
            <Ionicons name="id-card-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuText}>Verify Drivers License</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('VehicleManagement')}
          >
            <Ionicons name="car-sport-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuText}>Vehicle Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

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
    gap: 16,
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
  vehicleCard: {
    gap: 8,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  editLink: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  vehicleDetails: {
    gap: 4,
  },
  vehicleMain: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  vehicleMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  menuCard: {
    paddingVertical: 4,
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
