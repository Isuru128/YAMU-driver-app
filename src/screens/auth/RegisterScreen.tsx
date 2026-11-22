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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, isLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!firstName.trim()) {
      errs.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      errs.lastName = 'Last name is required';
    }
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!phoneNumber.trim()) {
      errs.phoneNumber = 'Phone number is required';
    } else if (!isValidSriLankanPhone(phoneNumber)) {
      errs.phoneNumber = 'Enter a valid Sri Lankan phone (e.g. 077 123 4567)';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    setGeneralError(null);
    if (!validate()) return;

    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        role: 'DRIVER',
      });
    } catch (err: any) {
      const msg = err?.message || 'Driver registration failed. Please check your details.';
      setGeneralError(msg);
      Alert.alert('Registration Failed', msg);
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
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandHeader}>
            <Text style={styles.logoText}>YAMU DRIVER</Text>
            <Text style={styles.tagline}>Create your driver partner account</Text>
          </View>

          {generalError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          )}

          <View style={styles.formSection}>
            <View style={styles.nameRow}>
              <View style={styles.halfInput}>
                <Input
                  label="First Name"
                  placeholder="First name"
                  value={firstName}
                  onChangeText={(val) => {
                    setFirstName(val);
                    if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
                  }}
                  returnKeyType="next"
                  error={errors.firstName}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Last Name"
                  placeholder="Last name"
                  value={lastName}
                  onChangeText={(val) => {
                    setLastName(val);
                    if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                  }}
                  returnKeyType="next"
                  error={errors.lastName}
                />
              </View>
            </View>

            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.textMuted} />}
            />

            <Input
              label="Phone Number"
              placeholder="077 123 4567"
              value={phoneNumber}
              onChangeText={(val) => {
                setPhoneNumber(val);
                if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
              }}
              keyboardType="phone-pad"
              returnKeyType="next"
              error={errors.phoneNumber}
              leftIcon={<Ionicons name="call-outline" size={20} color={Colors.textMuted} />}
            />

            <Input
              label="Password (min 6 chars)"
              placeholder="••••••••"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />}
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
              title="Create Driver Account"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.submitButton}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
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
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 140,
  },
  brandHeader: {
    marginTop: 32,
    marginBottom: 28,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  tagline: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    ...Typography.caption,
    color: Colors.danger,
    flex: 1,
  },
  formSection: {
    marginVertical: 8,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  signInLink: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  termsText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 100,
  },
});
