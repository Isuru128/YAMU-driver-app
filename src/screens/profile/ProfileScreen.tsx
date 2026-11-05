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
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../hooks/useAuth';
import { useDriver } from '../../hooks/useDriver';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { driverProfile, availabilityStatus } = useDriver();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of YAMU Driver?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
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

        {/* Vehicle Summary Card */}
        <Card style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <Text style={styles.sectionTitle}>Assigned Vehicle & License</Text>
            <TouchableOpacity onPress={() => navigation.navigate('VehicleManagement')}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          {driverProfile?.vehicle ? (
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleMain}>
                {driverProfile.vehicle.make} {driverProfile.vehicle.model} (
                {driverProfile.vehicle.vehicleType})
              </Text>
              <Text style={styles.vehicleMeta}>
                Plate: {driverProfile.vehicle.licensePlate} • Color: {driverProfile.vehicle.color}
              </Text>
              <Text style={styles.vehicleMeta}>
                License No: {driverProfile.licenseNumber} • Service Area:{' '}
                {driverProfile.serviceArea}
              </Text>
            </View>
          ) : (
            <Text style={styles.vehicleMeta}>
              No vehicle registered yet. Tap Edit to configure your vehicle and license.
            </Text>
          )}
        </Card>

        {/* Menu Actions */}
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('VehicleManagement')}
          >
            <Ionicons name="car-sport-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuText}>Vehicle & License Settings</Text>
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
    gap: 8,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  editLink: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  vehicleDetails: {
    gap: 4,
  },
  vehicleMain: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  vehicleMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
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

