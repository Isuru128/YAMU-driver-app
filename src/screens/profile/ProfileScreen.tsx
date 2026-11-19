import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { VEHICLE_OPTIONS } from '../../constants/rideConstants';
import { useAuth } from '../../hooks/useAuth';
import { useDriver } from '../../hooks/useDriver';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const {
    driverProfile,
    vehicles,
    availabilityStatus,
    selectActiveVehicle,
    isLoadingDriver,
  } = useDriver();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of YAMU Driver?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSelectActiveVehicle = async (vehicleIdOrPlate: string) => {
    try {
      await selectActiveVehicle(vehicleIdOrPlate);
    } catch (err: any) {
      Alert.alert(
        'Cannot Switch Vehicle',
        err?.message || 'Unable to change active vehicle right now.'
      );
    }
  };

  return (
    <SafeScreen>
      <AppHeader title="Driver Account" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Driver Header Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.fullName || 'D').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.fullName || 'Driver Partner'}</Text>
            <Text style={styles.subText}>{user?.email || user?.phoneNumber}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.badge}>
                <Ionicons name="star" size={12} color={Colors.secondary} />
                <Text style={styles.badgeText}>
                  {(driverProfile?.rating ?? user?.rating ?? 4.95).toFixed(2)}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{availabilityStatus}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Registered Vehicles & Active Vehicle Tick Card */}
        <Card style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <View>
              <Text style={styles.sectionTitle}>My Registered Vehicles</Text>
              <Text style={styles.sectionHint}>
                Tick one active vehicle to use when going online
              </Text>
            </View>
            {vehicles.length > 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('VehicleManagement', { mode: 'manage' })}
              >
                <Text style={styles.editLink}>Manage</Text>
              </TouchableOpacity>
            )}
          </View>

          {driverProfile?.licenseNumber ? (
            <View style={styles.credentialsBanner}>
              <Ionicons name="id-card-outline" size={16} color={Colors.primary} />
              <Text style={styles.credentialsText}>
                License: {driverProfile.licenseNumber} • Service City: {driverProfile.serviceArea}
              </Text>
            </View>
          ) : null}

          {vehicles.length > 0 ? (
            <View style={styles.vehicleList}>
              {vehicles.map((veh) => {
                const isTicked = !!veh.isActive;
                const vOption = VEHICLE_OPTIONS.find((o) => o.id === veh.vehicleType);
                const key = veh.id || veh.licensePlate;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.vehicleItem, isTicked && styles.vehicleItemActive]}
                    activeOpacity={0.85}
                    disabled={isLoadingDriver}
                    onPress={() => handleSelectActiveVehicle(key)}
                  >
                    <View
                      style={[
                        styles.vehicleIconWrap,
                        isTicked && styles.vehicleIconWrapActive,
                      ]}
                    >
                      <Ionicons
                        name={(vOption?.iconName as any) || 'car-sport'}
                        size={20}
                        color={isTicked ? Colors.white : Colors.primary}
                      />
                    </View>

                    <View style={styles.vehicleInfoWrap}>
                      <View style={styles.vehicleTitleRow}>
                        <Text style={styles.vehicleMain}>
                          {veh.make} {veh.model} ({veh.vehicleType})
                        </Text>
                        {isTicked && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.vehicleMeta}>
                        Plate: {veh.licensePlate} • Color: {veh.color}
                        {veh.year ? ` • ${veh.year}` : ''}
                      </Text>
                    </View>

                    {/* Active Vehicle Tick */}
                    <View style={styles.tickWrap}>
                      <Ionicons
                        name={isTicked ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={isTicked ? Colors.success : Colors.textMuted}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyVehicleBox}>
              <Ionicons name="car-sport-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.vehicleMeta}>
                No vehicle registered yet. Add your driving license and first vehicle to go online.
              </Text>
            </View>
          )}

          <Button
            title="Add a vehicle"
            onPress={() => navigation.navigate('VehicleManagement', { mode: 'add' })}
            icon={<Ionicons name="add-circle-outline" size={20} color={Colors.white} />}
            style={styles.addVehicleBtn}
          />
        </Card>

        {/* Menu Actions */}
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('VehicleManagement', { mode: 'add' })}
          >
            <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
            <Text style={[styles.menuText, { color: Colors.primary }]}>Add a vehicle</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('VehicleManagement', { mode: 'manage' })}
          >
            <Ionicons name="car-sport-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuText}>Manage Vehicles & License</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="person-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuText}>Edit Personal Profile</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EmergencySupport')}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color={Colors.danger} />
            <Text style={styles.menuText}>Emergency & Roadside Support</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
            <Text style={[styles.menuText, { color: Colors.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.h1,
    color: Colors.white,
  },
  name: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  subText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  vehicleCard: {
    gap: 12,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  sectionHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editLink: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  credentialsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  credentialsText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  vehicleList: {
    gap: 10,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  vehicleItemActive: {
    borderColor: Colors.success,
    backgroundColor: '#F0FDF4',
  },
  vehicleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  vehicleInfoWrap: {
    flex: 1,
    gap: 3,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  vehicleMain: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  activeBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  vehicleMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  tickWrap: {
    paddingLeft: 4,
  },
  emptyVehicleBox: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  addVehicleBtn: {
    marginTop: 4,
  },
  menuCard: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  menuText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    flex: 1,
  },
});

