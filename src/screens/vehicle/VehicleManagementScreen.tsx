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
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { VehicleType, VEHICLE_OPTIONS } from '../../constants/rideConstants';
import { APP_CONFIG } from '../../config/appConfig';
import { useDriver } from '../../hooks/useDriver';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleManagement'>;

export const VehicleManagementScreen: React.FC<Props> = ({ navigation }) => {
  const {
    driverProfile,
    isLoadingDriver,
    registerOrUpdateDriverProfile,
    updateDriverVehicle,
  } = useDriver();

  const [licenseNumber, setLicenseNumber] = useState(driverProfile?.licenseNumber || '');
  const [serviceArea, setServiceArea] = useState(driverProfile?.serviceArea || 'Colombo');
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    driverProfile?.vehicle?.vehicleType || VehicleType.TUK
  );
  const [licensePlate, setLicensePlate] = useState(driverProfile?.vehicle?.licensePlate || '');
  const [make, setMake] = useState(driverProfile?.vehicle?.make || '');
  const [model, setModel] = useState(driverProfile?.vehicle?.model || '');
  const [year, setYear] = useState(
    driverProfile?.vehicle?.year ? String(driverProfile.vehicle.year) : '2022'
  );
  const [color, setColor] = useState(driverProfile?.vehicle?.color || 'White');

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
        if (!licenseNumber.trim()) {
          Alert.alert('License Required', 'Please enter your driving license number.');
          return;
        }
        await registerOrUpdateDriverProfile({
          licenseNumber: licenseNumber.trim().toUpperCase(),
          serviceArea: serviceArea.trim() || 'Colombo',
          vehicle: vehiclePayload,
        });
      }

      Alert.alert('Saved', 'Your driver & vehicle details have been updated.', [
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
      <AppHeader title="Driver & Vehicle Setup" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Driver Credentials</Text>
        <Input
          label="Driving License Number"
          placeholder="B1234567"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          editable={!driverProfile?.id}
          autoCapitalize="characters"
        />

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
          title={driverProfile?.id ? 'Update Vehicle Details' : 'Register Driver & Vehicle'}
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

