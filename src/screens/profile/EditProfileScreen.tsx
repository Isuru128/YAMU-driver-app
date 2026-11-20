import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { cloudinaryService } from '../../services/cloudinaryService';
import { useAuth } from '../../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateProfile, updateUser, isLoading } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.profile?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(
    user?.profile?.emergencyContact || ''
  );
  const [avatarUri, setAvatarUri] = useState<string>(
    user?.avatarUrl || user?.profile?.profilePictureUrl || ''
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const pickProfilePhoto = async (useCamera: boolean = false) => {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!perm.granted) {
        Alert.alert(
          'Permission Required',
          `Please grant ${useCamera ? 'camera' : 'photo library'} access to set your profile picture.`
        );
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setAvatarUri(localUri);

        // Immediately upload to Cloudinary (swsqjk22)
        setUploadingPhoto(true);
        try {
          const uploadRes = await cloudinaryService.uploadProfileImage(localUri, user?.id);
          setAvatarUri(uploadRes.secureUrl);
          updateUser({
            avatarUrl: uploadRes.secureUrl,
            profile: {
              ...user?.profile,
              profilePictureUrl: uploadRes.secureUrl,
            },
          });
        } catch (err: any) {
          Alert.alert('Upload Notice', err?.message || 'Could not upload photo to Cloudinary.');
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (error: any) {
      Alert.alert('Photo Error', error?.message || 'Could not pick profile image.');
    }
  };

  const handlePromptPhoto = () => {
    Alert.alert('Driver Profile Photo', 'Choose a photo for your driver account', [
      { text: 'Take Selfie (Camera)', onPress: () => pickProfilePhoto(true) },
      { text: 'Choose from Gallery', onPress: () => pickProfilePhoto(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    setUploadingPhoto(true);
    try {
      let finalPhotoUrl = avatarUri;

      if (avatarUri && !avatarUri.startsWith('http')) {
        const uploaded = await cloudinaryService.uploadProfileImage(avatarUri, user?.id);
        finalPhotoUrl = uploaded.secureUrl;
      }

      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        profile: {
          ...user?.profile,
          address: address.trim(),
          emergencyContact: emergencyContact.trim(),
          profilePictureUrl: finalPhotoUrl || undefined,
        },
      });
      Alert.alert('Profile Updated', 'Your driver profile and photo have been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Profile Saved Locally', err?.message || 'Saved changes.');
      navigation.goBack();
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <SafeScreen>
      <AppHeader title="Edit Personal Profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Driver Profile Image Picker */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.avatarWrapper}
            onPress={handlePromptPhoto}
            disabled={uploadingPhoto}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {(firstName || user?.fullName || 'D').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.cameraBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="camera" size={16} color={Colors.white} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePromptPhoto} disabled={uploadingPhoto}>
            <Text style={styles.changePhotoText}>
              {uploadingPhoto
                ? 'Uploading to Cloudinary...'
                : avatarUri
                  ? 'Change Profile Photo'
                  : 'Add Driver Profile Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        <Input label="First Name" value={firstName} onChangeText={setFirstName} />
        <Input label="Last Name" value={lastName} onChangeText={setLastName} />
        <Input
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <Input
          label="Residential Address"
          placeholder="Colombo, Sri Lanka"
          value={address}
          onChangeText={setAddress}
        />
        <Input
          label="Emergency Contact Number"
          placeholder="+94 77 123 4567"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          keyboardType="phone-pad"
        />

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={isLoading || uploadingPhoto}
          style={styles.btn}
        />
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    position: 'relative',
    marginBottom: 10,
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarFallback: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.white,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    borderWidth: 2.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  btn: {
    marginTop: 12,
  },
});
