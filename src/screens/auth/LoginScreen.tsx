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
  const { login, isLoading } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const isPhoneInput =
    identifier.trim().length > 0 &&
    !identifier.includes('@') &&
    /^[+\d\s-]+$/.test(identifier.trim());

  const handleLogin = async () => {
    setGeneralError(null);
    const errs: Record<string, string> = {};
    const trimmed = identifier.trim();

    if (!trimmed) {
      errs.identifier = 'Email or phone number is required';
    } else if (!isValidEmail(trimmed) && !isValidSriLankanPhone(trimmed)) {
      errs.identifier = 'Enter a valid email address or Sri Lankan phone number (e.g. 077 123 4567)';
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
      await login({
        identifier: trimmed,
        email: trimmed,
        password,
      });
    } catch (err: any) {
      const msg = err?.message || 'Invalid credentials. Please try again.';
      setGeneralError(msg);
      Alert.alert('Login Failed', msg);
    }
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandHeader}>
            <View style={styles.partnerPill}>
              <Ionicons name="car-sport" size={14} color={Colors.white} />
              <Text style={styles.partnerPillText}>DRIVER PARTNER</Text>
            </View>
            <Text style={styles.logoText}>YAMU</Text>
            <Text style={styles.tagline}>Drive on your schedule. Earn more every trip.</Text>
          </View>

          {generalError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          )}

          <View style={styles.formSection}>
            <Text style={styles.title}>Driver Sign In</Text>
            <Text style={styles.subtitle}>
              Sign in with your registered email or phone number
            </Text>

            <Input
              label="Email or Phone Number"
              placeholder="email or phone"
              value={identifier}
              onChangeText={(val) => {
                setIdentifier(val);
                if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: '' }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              error={errors.identifier}
              leftIcon={
                <Ionicons
                  name={isPhoneInput ? 'call-outline' : 'person-outline'}
                  size={20}
                  color={Colors.textMuted}
                />
              }
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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
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
              onPress={handleLogin}
              loading={isLoading}
              style={styles.button}
            />
          </View>

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
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120,
  },
  brandHeader: {
    marginTop: 72,
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
    marginTop: 48,
    marginBottom: 14,
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
    marginTop: 4,
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
