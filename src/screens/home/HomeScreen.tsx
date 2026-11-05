import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { WhiteThemedMap } from '../../components/map/WhiteThemedMap';
import { OnlineStatusToggle } from '../../components/driver/OnlineStatusToggle';
import { RideRequestModal } from '../../components/driver/RideRequestModal';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useDriver } from '../../hooks/useDriver';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { currentLocation, currentAddress, refreshLocation } = useLocation();
  const {
    driverProfile,
    availabilityStatus,
    isOnline,
    isLoadingDriver,
    incomingRide,
    activeTrip,
    earnings,
    toggleOnlineStatus,
    simulateIncomingRide,
    acceptIncomingRide,
    declineIncomingRide,
    syncDriverLocation,
  } = useDriver();

  useEffect(() => {
    if (activeTrip) {
      navigation.navigate('ActiveTrip');
    }
  }, [activeTrip, navigation]);

  const handleToggleOnline = async () => {
    try {
      await toggleOnlineStatus();
    } catch (err: any) {
      Alert.alert(
        'Cannot Change Status',
        err?.message || 'Please complete your vehicle registration first.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Setup Vehicle',
            onPress: () => navigation.navigate('VehicleManagement'),
          },
        ]
      );
    }
  };

  const handleAcceptOffer = async () => {
    const trip = await acceptIncomingRide();
    if (trip) {
      navigation.navigate('ActiveTrip');
    }
  };

  const handleRecenter = async () => {
    await refreshLocation();
    await syncDriverLocation();
  };

  return (
    <SafeScreen edges={['top']}>
      <View style={styles.container}>
        {/* Top Floating Bar: Today's Earnings & Online Toggle */}
        <View style={styles.topOverlay}>
          <TouchableOpacity
            style={styles.earningsPill}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Earnings')}
          >
            <Text style={styles.earningsLabel}>TODAY</Text>
            <Text style={styles.earningsValue}>{formatCurrency(earnings.todayEarnings)}</Text>
          </TouchableOpacity>

          <OnlineStatusToggle
            status={availabilityStatus}
            loading={isLoadingDriver}
            onToggle={handleToggleOnline}
          />
        </View>

        {/* Live Driver Map */}
        <WhiteThemedMap
          driverCoordinates={currentLocation}
          driverLabel={
            driverProfile?.vehicle?.licensePlate
              ? `${driverProfile.vehicle.licensePlate}`
              : user?.firstName || 'Driver'
          }
          pickupCoordinates={incomingRide?.pickup.coordinates}
          pickupLabel={incomingRide?.pickup.name}
          destinationCoordinates={incomingRide?.destination.coordinates}
          destinationLabel={incomingRide?.destination.name}
          onRecenter={handleRecenter}
        />

        {/* Bottom Overlay: Incoming Ride Offer OR Driver Radar Card */}
        <View style={styles.bottomSheet}>
          {incomingRide ? (
            <RideRequestModal
              offer={incomingRide}
              loading={isLoadingDriver}
              onAccept={handleAcceptOffer}
              onDecline={declineIncomingRide}
            />
          ) : (
            <View style={styles.radarCard}>
              {/* Vehicle Setup Banner if driver profile not registered in backend */}
              {!driverProfile?.vehicle ? (
                <TouchableOpacity
                  style={styles.setupBanner}
                  onPress={() => navigation.navigate('VehicleManagement')}
                >
                  <Ionicons name="warning" size={20} color={Colors.secondary} />
                  <View style={styles.setupBannerTextWrap}>
                    <Text style={styles.setupBannerTitle}>Complete Vehicle Setup</Text>
                    <Text style={styles.setupBannerSub}>
                      Register your license & vehicle to accept live passenger trips
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.vehicleRow}
                  onPress={() => navigation.navigate('VehicleManagement')}
                >
                  <View style={styles.vehicleBadgeIcon}>
                    <Ionicons name="car-sport" size={18} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleTitle}>
                      {driverProfile.vehicle.make} {driverProfile.vehicle.model} (
                      {driverProfile.vehicle.vehicleType})
                    </Text>
                    <Text style={styles.vehicleSub}>
                      {driverProfile.vehicle.licensePlate} • {driverProfile.serviceArea}
                    </Text>
                  </View>
                  <Text style={styles.changeLink}>Manage</Text>
                </TouchableOpacity>
              )}

              <View style={styles.divider} />

              {/* Status & Radar */}
              <View style={styles.statusRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.radarTitle}>
                    {isOnline
                      ? 'Finding trips near you...'
                      : 'You are currently offline'}
                  </Text>
                  <Text style={styles.radarSubtitle} numberOfLines={1}>
                    <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />{' '}
                    {currentAddress}
                  </Text>
                </View>

                <View style={styles.statsMini}>
                  <Text style={styles.statsMiniVal}>{earnings.todayTrips}</Text>
                  <Text style={styles.statsMiniLbl}>Trips Today</Text>
                </View>
              </View>

              {isOnline ? (
                <Button
                  title="Simulate Incoming Ride Request"
                  variant="secondary"
                  size="medium"
                  onPress={simulateIncomingRide}
                  icon={<Ionicons name="notifications-outline" size={18} color={Colors.white} />}
                  style={styles.simBtn}
                />
              ) : (
                <Button
                  title="Go Online to Start Earning"
                  variant="primary"
                  onPress={handleToggleOnline}
                  loading={isLoadingDriver}
                  style={styles.simBtn}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  topOverlay: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    zIndex: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  earningsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  earningsValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  bottomSheet: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    zIndex: 30,
  },
  radarCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  setupBannerTextWrap: {
    flex: 1,
  },
  setupBannerTitle: {
    ...Typography.bodyBold,
    color: '#92400E',
  },
  setupBannerSub: {
    ...Typography.caption,
    color: '#B45309',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  vehicleSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  changeLink: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  radarTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  radarSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsMini: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsMiniVal: {
    ...Typography.h3,
    color: Colors.primary,
  },
  statsMiniLbl: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  simBtn: {
    marginTop: 2,
  },
});
