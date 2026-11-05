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
import { VehicleType, VEHICLE_OPTIONS } from '../../constants/rideConstants';
import { isValidEmail, isValidSriLankanPhone } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import { driverService } from '../../services/driverService';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, isLoading } = useAuth();

  // Personal account fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Driver & Vehicle fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [serviceArea, setServiceArea] = useState('Colombo');
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.TUK);
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('Red');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
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
    if (!password || password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (!licenseNumber.trim()) {
      errs.licenseNumber = 'Driving license number is required';
    }
    if (!licensePlate.trim()) {
      errs.licensePlate = 'Vehicle license plate is required (e.g. WP AA-4521)';
    }
    if (!vehicleMake.trim()) {
      errs.vehicleMake = 'Vehicle make is required (e.g. Bajaj, Toyota)';
    }
    if (!vehicleModel.trim()) {
      errs.vehicleModel = 'Vehicle model is required (e.g. RE 4S, Aqua)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    setGeneralError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      // 1. Register DRIVER account in Account Service
      const authRes = await register({
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        role: 'DRIVER',
      });

      // 2. Register Driver & Vehicle operational profile in Driver Service
      try {
        const selectedOption = VEHICLE_OPTIONS.find((v) => v.id === vehicleType);
        await driverService.registerDriver(
          {
            userId: authRes.account?.id,
            licenseNumber: licenseNumber.trim().toUpperCase(),
            serviceArea: serviceArea.trim() || 'Colombo',
            vehicle: {
              licensePlate: licensePlate.trim().toUpperCase(),
              make: vehicleMake.trim(),
              model: vehicleModel.trim(),
              year: 2022,
              color: vehicleColor.trim() || 'White',
              vehicleType,
              capacity: selectedOption?.capacity || 3,
            },
          },
          authRes.token
        );
      } catch (driverErr) {
        console.warn('Driver operational profile setup notice:', driverErr);
      }
    } catch (err: any) {
      const msg = err?.message || 'Driver registration failed. Please check your details.';
      setGeneralError(msg);
      Alert.alert('Registration Failed', msg);
    } finally {
      setSubmitting(false);
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
            <Text style={styles.logoText}>YAMU DRIVER</Text>
            <Text style={styles.tagline}>Register your driver account & vehicle</Text>
          </View>

          {generalError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          )}

          <View style={styles.formSection}>
            <Text style={styles.sectionHeader}>1. Personal Details</Text>
            <View style={styles.nameRow}>
              <View style={styles.halfInput}>
                <Input
                  label="First Name"
                  placeholder="Kamal"
                  value={firstName}
                  onChangeText={(val) => {
                    setFirstName(val);
                    if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
                  }}
                  error={errors.firstName}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Last Name"
                  placeholder="Perera"
                  value={lastName}
                  onChangeText={(val) => {
                    setLastName(val);
                    if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                  }}
                  error={errors.lastName}
                />
              </View>
            </View>

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
              label="Phone Number"
              placeholder="077 123 4567"
              value={phoneNumber}
              onChangeText={(val) => {
                setPhoneNumber(val);
                if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
              }}
              keyboardType="phone-pad"
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

            <Text style={[styles.sectionHeader, { marginTop: 12 }]}>
              2. License & Vehicle Information
            </Text>

            <View style={styles.nameRow}>
              <View style={styles.halfInput}>
                <Input
                  label="Driving License No."
                  placeholder="B1234567"
                  value={licenseNumber}
                  onChangeText={(val) => {
                    setLicenseNumber(val);
                    if (errors.licenseNumber) setErrors((prev) => ({ ...prev, licenseNumber: '' }));
                  }}
                  autoCapitalize="characters"
                  error={errors.licenseNumber}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Service City"
                  placeholder="Colombo"
                  value={serviceArea}
                  onChangeText={setServiceArea}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>VEHICLE CATEGORY</Text>
            <View style={styles.vehicleTypeRow}>
              {VEHICLE_OPTIONS.map((v) => {
                const selected = vehicleType === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vTypeChip, selected && styles.vTypeChipActive]}
                    onPress={() => setVehicleType(v.id)}
                  >
                    <Ionicons
                      name={v.iconName as any}
                      size={18}
                      color={selected ? Colors.white : Colors.textPrimary}
                    />
                    <Text style={[styles.vTypeText, selected && styles.vTypeTextActive]}>
                      {v.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.nameRow}>
              <View style={styles.halfInput}>
                <Input
                  label="License Plate"
                  placeholder="WP AA-4521"
                  value={licensePlate}
                  onChangeText={(val) => {
                    setLicensePlate(val);
                    if (errors.licensePlate) setErrors((prev) => ({ ...prev, licensePlate: '' }));
                  }}
                  autoCapitalize="characters"
                  error={errors.licensePlate}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Color"
                  placeholder="Red / White"
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                />
              </View>
            </View>

            <View style={styles.nameRow}>
              <View style={styles.halfInput}>
                <Input
                  label="Vehicle Make"
                  placeholder="Bajaj / Toyota"
                  value={vehicleMake}
                  onChangeText={(val) => {
                    setVehicleMake(val);
                    if (errors.vehicleMake) setErrors((prev) => ({ ...prev, vehicleMake: '' }));
                  }}
                  error={errors.vehicleMake}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Vehicle Model"
                  placeholder="RE 4S / Aqua"
                  value={vehicleModel}
                  onChangeText={(val) => {
                    setVehicleModel(val);
                    if (errors.vehicleModel) setErrors((prev) => ({ ...prev, vehicleModel: '' }));
                  }}
                  error={errors.vehicleModel}
                />
              </View>
            </View>

            <Button
              title="Complete Driver Registration"
              onPress={handleRegister}
              loading={isLoading || submitting}
              style={styles.submitButton}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already registered as a driver?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
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
    marginTop: 10,
    marginBottom: 14,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
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
    marginVertical: 6,
  },
  sectionHeader: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  vTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  vTypeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  vTypeText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  vTypeTextActive: {
    color: Colors.white,
  },
  submitButton: {
    marginTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 16,
  },
  footerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  signInLink: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
});

