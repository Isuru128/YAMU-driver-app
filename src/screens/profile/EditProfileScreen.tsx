import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateProfile, isLoading } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.profile?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(
    user?.profile?.emergencyContact || ''
  );

  const handleSave = async () => {
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        profile: {
          ...user?.profile,
          address: address.trim(),
          emergencyContact: emergencyContact.trim(),
        },
      });
      Alert.alert('Profile Updated', 'Your driver profile has been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update profile.');
    }
  };

  return (
    <SafeScreen>
      <AppHeader title="Edit Personal Profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
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
          loading={isLoading}
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
  btn: {
    marginTop: 12,
  },
});

