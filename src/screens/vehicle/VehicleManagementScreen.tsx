import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { VehicleType, VEHICLE_OPTIONS } from '../../constants/rideConstants';
import { APP_CONFIG } from '../../config/appConfig';
import { useDriver } from '../../hooks/useDriver';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleManagement'>;

export const VehicleManagementScreen: React.FC<Props> = ({ navigation }) => {
  const {
    driverProfile,
    vehicles,
    activeVehicle,
    licenseVerification,
    isLoadingDriver,
    registerOrUpdateDriverProfile,
    updateDriverVehicle,
    selectActiveVehicle,
  } = useDriver();

  const [serviceArea, setServiceArea] = useState(driverProfile?.serviceArea || 'Colombo');
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    activeVehicle?.vehicleType || driverProfile?.vehicle?.vehicleType || VehicleType.TUK
  );
  const [licensePlate, setLicensePlate] = useState(
    activeVehicle?.licensePlate || driverProfile?.vehicle?.licensePlate || ''
  );
  const [make, setMake] = useState(activeVehicle?.make || driverProfile?.vehicle?.make || '');
  const [model, setModel] = useState(activeVehicle?.model || driverProfile?.vehicle?.model || '');
  const [year, setYear] = useState(
    activeVehicle?.year
      ? String(activeVehicle.year)
      : driverProfile?.vehicle?.year
      ? String(driverProfile.vehicle.year)
      : '2022'
  );
  const [color, setColor] = useState(
    activeVehicle?.color || driverProfile?.vehicle?.color || 'White'
  );

  const isLicenseVerified =
    Boolean(licenseVerification?.isVerified) ||
    Boolean(
      driverProfile?.licenseNumber &&
        !driverProfile.licenseNumber.startsWith('PENDING-') &&
        driverProfile.licenseFrontImageUrl
    );

  const handleSave = async () => {
    if (!licensePlate.trim() || !make.trim() || !model.trim()) {
      Alert.alert('Missing Details', 'Please fill in license plate, vehicle make, and model.');
      return;
    }

    const selectedOpt = VEHICLE_OPTIONS.find((v) => v.id === vehicleType);
    const vehiclePayload = {
      licensePlate: licensePlate.trim().toUpperCase(),
      make: make.trim(),
      model: model.trim(),
      year: parseInt(year, 10) || 2022,
      color: color.trim() || 'White',
      vehicleType,
      capacity: selectedOpt?.capacity || 4,
    };

    try {
      if (driverProfile?.id) {
        await updateDriverVehicle(vehiclePayload);
      } else {
        await registerOrUpdateDriverProfile({
          serviceArea: serviceArea.trim() || 'Colombo',
          vehicle: vehiclePayload,
        });
      }

      Alert.alert('Saved', 'Your vehicle details have been registered and set as active.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Update Failed',
        err?.message || 'Could not update vehicle information. Please try again.'
      );
    }
  };

  return (
    <SafeScreen>
      <AppHeader title="Vehicle & License Setup" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Verify Driver's License Card & Action Button */}
        <Card style={styles.licenseCard}>
          <View style={styles.licenseCardHeader}>
            <View style={styles.licenseIconWrap}>
              <Ionicons
                name={isLicenseVerified ? 'shield-checkmark' : 'id-card-outline'}
                size={24}
                color={isLicenseVerified ? Colors.success : Colors.secondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.licenseCardTitle}>Driver’s License Verification</Text>
              <Text style={styles.licenseCardSub}>
                {isLicenseVerified
                  ? `License ${licenseVerification?.licenseNumber || driverProfile?.licenseNumber} • Expires ${
                      licenseVerification?.expiryDate || driverProfile?.licenseExpiryDate || 'Valid'
                    }`
                  : 'Submit your license number, front & back photos, and expiry date'}
              </Text>
            </View>
          </View>

          <Button
            title="Verify Drivers License"
            variant={isLicenseVerified ? 'outline' : 'secondary'}
            size="medium"
            onPress={() => navigation.navigate('LicenseVerification')}
            icon={
              <Ionicons
                name="card-outline"
                size={18}
                color={isLicenseVerified ? Colors.primary : Colors.white}
              />
            }
            style={styles.verifyLicenseBtn}
          />
        </Card>

        {/* Registered Vehicles List (if driver has vehicles) */}
        {vehicles.length > 0 && (
          <View style={styles.registeredSection}>
            <Text style={styles.sectionTitle}>Your Registered Vehicles</Text>
            {vehicles.map((v) => {
              const isActive =
                activeVehicle?.licensePlate.toUpperCase() === v.licensePlate.toUpperCase();
              return (
                <TouchableOpacity
                  key={v.licensePlate}
                  style={[styles.savedVehicleRow, isActive && styles.savedVehicleRowActive]}
                  onPress={() => {
                    selectActiveVehicle(v.licensePlate);
                    setVehicleType(v.vehicleType);
                    setLicensePlate(v.licensePlate);
                    setMake(v.make);
                    setModel(v.model);
                    setYear(v.year ? String(v.year) : '2022');
                    setColor(v.color || 'White');
                  }}
                >
                  <Ionicons
                    name={isActive ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isActive ? Colors.success : Colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedVehicleTitle}>
                      {v.make} {v.model} ({v.vehicleType})
                    </Text>
                    <Text style={styles.savedVehicleSub}>
                      {v.licensePlate} • {v.color}
                    </Text>
                  </View>
                  {isActive && <Text style={styles.activeTag}>ACTIVE</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.label}>PRIMARY SERVICE AREA</Text>
        <View style={styles.chipsWrap}>
          {APP_CONFIG.serviceAreas.map((area) => {
            const active = serviceArea.toLowerCase() === area.toLowerCase();
            return (
              <TouchableOpacity
                key={area}
                style={[styles.areaChip, active && styles.areaChipActive]}
                onPress={() => setServiceArea(area)}
              >
                <Text style={[styles.areaChipText, active && styles.areaChipTextActive]}>
                  {area}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Vehicle Category</Text>
        <View style={styles.vehicleGrid}>
          {VEHICLE_OPTIONS.map((v) => {
            const selected = vehicleType === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.vehicleCard, selected && styles.vehicleCardActive]}
                onPress={() => setVehicleType(v.id)}
              >
                <Ionicons
                  name={v.iconName as any}
                  size={24}
                  color={selected ? Colors.white : Colors.primary}
                />
                <Text style={[styles.vehicleCardName, selected && { color: Colors.white }]}>
                  {v.name}
                </Text>
                <Text
                  style={[
                    styles.vehicleCardCap,
                    selected && { color: 'rgba(255,255,255,0.8)' },
                  ]}
                >
                  {v.capacity} Seats
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Vehicle Specifications</Text>
        <Input
          label="License Plate Number"
          placeholder="WP CAB-4521"
          value={licensePlate}
          onChangeText={setLicensePlate}
          autoCapitalize="characters"
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="Vehicle Make"
              placeholder="Toyota / Bajaj"
              value={make}
              onChangeText={setMake}
            />
          </View>
          <View style={styles.half}>
            <Input
              label="Vehicle Model"
              placeholder="Aqua / RE 4S"
              value={model}
              onChangeText={setModel}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="Manufacture Year"
              placeholder="2022"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <Input
              label="Exterior Color"
              placeholder="White"
              value={color}
              onChangeText={setColor}
            />
          </View>
        </View>

        <Button
          title={driverProfile?.id ? 'Save Vehicle Details' : 'Register Vehicle'}
          onPress={handleSave}
          loading={isLoadingDriver}
          style={styles.saveBtn}
        />
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  licenseCard: {
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  licenseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  licenseIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  licenseCardTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  licenseCardSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  verifyLicenseBtn: {
    width: '100%',
  },
  registeredSection: {
    marginBottom: 18,
    gap: 8,
  },
  savedVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  savedVehicleRowActive: {
    borderColor: Colors.success,
    backgroundColor: '#F0FDF4',
  },
  savedVehicleTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  savedVehicleSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  activeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  areaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  areaChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  areaChipText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  areaChipTextActive: {
    color: Colors.white,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  vehicleCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
  },
  vehicleCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  vehicleCardName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  vehicleCardCap: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  saveBtn: {
    marginTop: 12,
    marginBottom: 28,
  },
});
