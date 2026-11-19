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

export const VehicleManagementScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    driverProfile,
    vehicles,
    isLoadingDriver,
    addDriverVehicle,
    selectActiveVehicle,
    removeDriverVehicle,
  } = useDriver();

  const initialMode = route.params?.mode || (vehicles.length === 0 ? 'add' : 'add');

  const [licenseNumber, setLicenseNumber] = useState(driverProfile?.licenseNumber || '');
  const [serviceArea, setServiceArea] = useState(driverProfile?.serviceArea || 'Colombo');
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.TUK);
  const [licensePlate, setLicensePlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2022');
  const [color, setColor] = useState('White');
  const [setAsActive, setSetAsActive] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(
    initialMode === 'add' || vehicles.length === 0
  );

  const handleActivateVehicle = async (vehicleIdOrPlate: string) => {
    try {
      await selectActiveVehicle(vehicleIdOrPlate);
    } catch (err: any) {
      Alert.alert(
        'Cannot Switch Vehicle',
        err?.message || 'Unable to change active vehicle right now.'
      );
    }
  };

  const handleRemoveVehicle = (vehicleIdOrPlate: string, plateLabel: string) => {
    Alert.alert(
      'Remove Vehicle',
      `Are you sure you want to remove vehicle ${plateLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDriverVehicle(vehicleIdOrPlate);
            } catch (err: any) {
              Alert.alert('Cannot Remove Vehicle', err?.message || 'Try again when offline.');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    const cleanLicense = (licenseNumber || driverProfile?.licenseNumber || '').trim();
    if (!cleanLicense) {
      Alert.alert('License Required', 'Please enter your driving license number.');
      return;
    }

    if (!licensePlate.trim() || !make.trim() || !model.trim()) {
      Alert.alert(
        'Missing Details',
        'Please fill in vehicle license plate, make, and model.'
      );
      return;
    }

    const selectedOpt = VEHICLE_OPTIONS.find((v) => v.id === vehicleType);
    const shouldActivate = vehicles.length === 0 ? true : setAsActive;

    try {
      await addDriverVehicle({
        licenseNumber: cleanLicense.toUpperCase(),
        serviceArea: serviceArea.trim() || 'Colombo',
        setAsActive: shouldActivate,
        vehicle: {
          licensePlate: licensePlate.trim().toUpperCase(),
          make: make.trim(),
          model: model.trim(),
          year: parseInt(year, 10) || 2022,
          color: color.trim() || 'White',
          vehicleType,
          capacity: selectedOpt?.capacity || 3,
        },
      });

      // Reset form fields for adding another vehicle
      setLicensePlate('');
      setMake('');
      setModel('');
      setColor('White');
      setYear('2022');
      setShowAddForm(false);

      Alert.alert(
        'Vehicle Registered',
        shouldActivate
          ? 'Your vehicle has been added and set as your active vehicle for online trips.'
          : 'Your vehicle has been added to your registered vehicles list.'
      );
    } catch (err: any) {
      Alert.alert(
        'Registration Failed',
        err?.message || 'Could not register vehicle information. Please try again.'
      );
    }
  };

  return (
    <SafeScreen>
      <AppHeader title="Add & Manage Vehicles" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Registered Vehicles List with Single Active Tick */}
        {vehicles.length > 0 && (
          <View style={styles.registeredSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Registered Vehicles ({vehicles.length})</Text>
                <Text style={styles.sectionSubtitle}>
                  Tap a vehicle to tick it as active when you go online (only one active at a time)
                </Text>
              </View>
            </View>

            <View style={styles.registeredList}>
              {vehicles.map((veh) => {
                const isTicked = !!veh.isActive;
                const vOpt = VEHICLE_OPTIONS.find((o) => o.id === veh.vehicleType);
                const key = veh.id || veh.licensePlate;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.regCard, isTicked && styles.regCardActive]}
                    activeOpacity={0.85}
                    onPress={() => handleActivateVehicle(key)}
                  >
                    <View
                      style={[
                        styles.regIconBox,
                        isTicked && styles.regIconBoxActive,
                      ]}
                    >
                      <Ionicons
                        name={(vOpt?.iconName as any) || 'car-sport'}
                        size={22}
                        color={isTicked ? Colors.white : Colors.primary}
                      />
                    </View>

                    <View style={styles.regInfo}>
                      <View style={styles.regTitleRow}>
                        <Text style={styles.regTitle}>
                          {veh.make} {veh.model} ({veh.vehicleType})
                        </Text>
                        {isTicked && (
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>ACTIVE FOR ONLINE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.regMeta}>
                        Plate: {veh.licensePlate} • Color: {veh.color}
                        {veh.year ? ` • ${veh.year}` : ''}
                      </Text>
                    </View>

                    <View style={styles.regActions}>
                      {vehicles.length > 1 && (
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleRemoveVehicle(key, veh.licensePlate)}
                        >
                          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                        </TouchableOpacity>
                      )}
                      <Ionicons
                        name={isTicked ? 'checkmark-circle' : 'ellipse-outline'}
                        size={26}
                        color={isTicked ? Colors.success : Colors.textMuted}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!showAddForm && (
              <Button
                title="Add Another Vehicle"
                onPress={() => setShowAddForm(true)}
                icon={<Ionicons name="add-circle-outline" size={20} color={Colors.white} />}
                style={styles.addMoreBtn}
              />
            )}
          </View>
        )}

        {/* Add Vehicle & Driver License Form */}
        {(showAddForm || vehicles.length === 0) && (
          <View style={styles.formContainer}>
            <View style={styles.formHeaderRow}>
              <Text style={styles.sectionTitle}>
                {vehicles.length === 0
                  ? 'Register License & First Vehicle'
                  : 'Register a New Vehicle'}
              </Text>
              {vehicles.length > 0 && (
                <TouchableOpacity onPress={() => setShowAddForm(false)}>
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.subHeader}>1. Driver License & Service Area</Text>
            <Input
              label="Driving License No."
              placeholder="B1234567"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
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

            <Text style={[styles.subHeader, { marginTop: 18 }]}>2. Vehicle Category</Text>
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

            <Text style={[styles.subHeader, { marginTop: 12 }]}>3. Vehicle Information</Text>
            <View style={styles.row}>
              <View style={styles.half}>
                <Input
                  label="License Plate"
                  placeholder="WP AA-4521"
                  value={licensePlate}
                  onChangeText={setLicensePlate}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.half}>
                <Input
                  label="Color"
                  placeholder="Red / White"
                  value={color}
                  onChangeText={setColor}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Input
                  label="Vehicle Make"
                  placeholder="Bajaj / Toyota"
                  value={make}
                  onChangeText={setMake}
                />
              </View>
              <View style={styles.half}>
                <Input
                  label="Vehicle Model"
                  placeholder="RE 4S / Aqua"
                  value={model}
                  onChangeText={setModel}
                />
              </View>
            </View>

            <Input
              label="Manufacture Year"
              placeholder="2022"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
            />

            {/* Active Vehicle Tick Option */}
            <TouchableOpacity
              style={styles.activeTickOption}
              activeOpacity={0.8}
              onPress={() => {
                if (vehicles.length > 0) {
                  setSetAsActive((prev) => !prev);
                }
              }}
            >
              <Ionicons
                name={
                  vehicles.length === 0 || setAsActive
                    ? 'checkbox'
                    : 'square-outline'
                }
                size={24}
                color={
                  vehicles.length === 0 || setAsActive
                    ? Colors.success
                    : Colors.textSecondary
                }
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeTickTitle}>
                  Set as active vehicle when going online
                </Text>
                <Text style={styles.activeTickSub}>
                  Only one vehicle can be activated at a time for receiving trips
                </Text>
              </View>
            </TouchableOpacity>

            <Button
              title="Register Vehicle"
              onPress={handleSave}
              loading={isLoadingDriver}
              style={styles.saveBtn}
            />
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  registeredSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  registeredList: {
    gap: 10,
  },
  regCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  regCardActive: {
    borderColor: Colors.success,
    backgroundColor: '#F0FDF4',
  },
  regIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regIconBoxActive: {
    backgroundColor: Colors.primary,
  },
  regInfo: {
    flex: 1,
    gap: 3,
  },
  regTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  regTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  activePill: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.4,
  },
  regMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  regActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    padding: 6,
  },
  addMoreBtn: {
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cancelText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
  subHeader: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: 10,
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
  activeTickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 6,
    marginBottom: 8,
  },
  activeTickTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  activeTickSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  saveBtn: {
    marginTop: 10,
    marginBottom: 6,
  },
});

