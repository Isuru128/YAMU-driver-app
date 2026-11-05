import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../hooks/useAuth';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { phoneNumber } = route.params;
  const { verifyOtp, isLoading } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (otp.length !== 4) {
      setError('Please enter a 4-digit OTP (e.g. 1234)');
      return;
    }
    setError('');
    const success = await verifyOtp(phoneNumber, otp);
    if (!success) {
      setError('Invalid verification code.');
    }
  };

  return (
    <SafeScreen>
      <AppHeader title="Verify Phone" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Text style={styles.title}>Enter 4-digit code</Text>
        <Text style={styles.subtitle}>
          Sent to {phoneNumber}. Use any 4 digits (e.g. 1234) for demo verification.
        </Text>

        <Input
          label="Verification Code"
          placeholder="1234"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={4}
          error={error}
        />

        <Button
          title="Verify & Continue"
          onPress={handleVerify}
          loading={isLoading}
          style={styles.button}
        />
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  button: {
    marginTop: 12,
  },
});

