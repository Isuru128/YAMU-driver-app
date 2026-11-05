import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { isValidEmail, isValidSriLankanPhone } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, loginWithPhone, isLoading } = useAuth();

  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleEmailLogin = async () => {
    setGeneralError(null);
    const errs: Record<string, string> = {};

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      await login({ email, password });
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password. Please try again.';
      setGeneralError(msg);
      Alert.alert('Login Failed', msg);
    }
  };

  const handlePhoneContinue = async () => {
    setGeneralError(null);
    if (!isValidSriLankanPhone(phone)) {
      setErrors({ phone: 'Please enter a valid Sri Lankan mobile number (e.g., 077 123 4567)' });
      return;
    }
    setErrors({});
    const success = await loginWithPhone(phone);
    if (success) {
      navigation.navigate('OtpVerification', { phoneNumber: phone });
    }
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brandHeader}>
            <View style={styles.partnerPill}>
              <Ionicons name="car-sport" size={14} color={Colors.white} />
              <Text style={styles.partnerPillText}>DRIVER PARTNER</Text>
            </View>
            <Text style={styles.logoText}>YAMU</Text>
            <Text style={styles.tagline}>Drive on your schedule. Earn more every trip.</Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, authMode === 'email' && styles.tabButtonActive]}
              onPress={() => {
                setAuthMode('email');
                setErrors({});
                setGeneralError(null);
              }}
            >
              <Text
                style={[styles.tabButtonText, authMode === 'email' && styles.tabButtonTextActive]}
              >
                Email Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, authMode === 'phone' && styles.tabButtonActive]}
              onPress={() => {
                setAuthMode('phone');
                setErrors({});
                setGeneralError(null);
              }}
            >
              <Text
                style={[styles.tabButtonText, authMode === 'phone' && styles.tabButtonTextActive]}
              >
                Phone OTP
              </Text>
            </TouchableOpacity>
          </View>

          {generalError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          )}

          {authMode === 'email' ? (
            <View style={styles.formSection}>
              <Text style={styles.title}>Driver Sign In</Text>
              <Text style={styles.subtitle}>Sign in with your registered driver account</Text>

              <Input
                label="Email Address"
                placeholder="driver@yamu.lk"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.textMuted} />}
              />

              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                error={errors.password}
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
                }
                rightIcon={
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.textMuted}
                  />
                }
                onRightIconPress={() => setShowPassword((prev) => !prev)}
              />

              <Button
                title="Sign In to Drive"
                onPress={handleEmailLogin}
                loading={isLoading}
                style={styles.button}
              />
            </View>
          ) : (
            <View style={styles.formSection}>
              <Text style={styles.title}>Driver Mobile Login</Text>
              <Text style={styles.subtitle}>Enter your registered mobile number for a 4-digit OTP</Text>

              <Input
                label="Phone Number"
                placeholder="077 123 4567"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                keyboardType="phone-pad"
                error={errors.phone}
                leftIcon={<Ionicons name="call-outline" size={20} color={Colors.textMuted} />}
              />

              <Button
                title="Continue with OTP"
                onPress={handlePhoneContinue}
                loading={isLoading}
                style={styles.button}
              />
            </View>
          )}

          <View style={styles.footerContainer}>
            <View style={styles.signupRow}>
              <Text style={styles.footerText}>New to YAMU Driver?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupLink}>Become a Driver</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.termsText}>
              By continuing, you agree to YAMU’s Driver Partner Terms & Safety Standards.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  brandHeader: {
    marginTop: 24,
    alignItems: 'center',
  },
  partnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  partnerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 1,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 2,
  },
  tagline: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  errorBannerText: {
    ...Typography.caption,
    color: Colors.danger,
    flex: 1,
  },
  formSection: {
    marginVertical: 24,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  button: {
    marginTop: 12,
  },
  footerContainer: {
    marginTop: 'auto',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  footerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  signupLink: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  termsText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
});

