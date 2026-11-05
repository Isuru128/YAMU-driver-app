import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { WhiteThemedMap } from '../../components/map/WhiteThemedMap';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { RideStatus } from '../../constants/rideConstants';
import { Coordinates } from '../../types/location';
import { formatCurrency, formatDistance, formatDuration } from '../../utils/formatters';
import { routingService } from '../../services/routingService';
import { useLocation } from '../../hooks/useLocation';
import { useDriver } from '../../hooks/useDriver';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveTrip'>;

export const ActiveTripScreen: React.FC<Props> = ({ navigation }) => {
  const { currentLocation } = useLocation();
  const {
    activeTrip,
    isLoadingDriver,
    startActiveTrip,
    completeActiveTrip,
    cancelActiveTrip,
  } = useDriver();

  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);

  useEffect(() => {
    if (!activeTrip) {
      navigation.replace('MainTabs');
      return;
    }

    let cancelled = false;
    const loadRoute = async () => {
      const origin =
        activeTrip.status === RideStatus.IN_PROGRESS
          ? activeTrip.pickup.coordinates
          : currentLocation;
      const target =
        activeTrip.status === RideStatus.IN_PROGRESS
          ? activeTrip.destination.coordinates
          : activeTrip.pickup.coordinates;

      const res = await routingService.getRoute(origin, target);
      if (!cancelled) {
        setRouteCoordinates(res.coordinates);
      }
    };

    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [activeTrip, currentLocation, navigation]);

  if (!activeTrip) {
    return null;
  }

  const isEnRouteToPickup =
    activeTrip.status === RideStatus.ASSIGNED || activeTrip.status === RideStatus.ACCEPTED;

  const handleCallPassenger = () => {
    Linking.openURL(`tel:${activeTrip.passenger.phone}`).catch(() => {
      Alert.alert('Passenger Phone', activeTrip.passenger.phone);
    });
  };

  const handleComplete = async () => {
    await completeActiveTrip();
    Alert.alert(
      'Trip Completed!',
      `Collect ${formatCurrency(activeTrip.fare)} (${activeTrip.paymentMethod}). Your net earning of ${formatCurrency(
        activeTrip.netEarning
      )} has been recorded.`
    );
    navigation.replace('MainTabs');
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this passenger trip?',
      [
        { text: 'Keep Trip', style: 'cancel' },
        {
          text: 'Cancel Trip',
          style: 'destructive',
          onPress: async () => {
            await cancelActiveTrip('Cancelled by driver');
            navigation.replace('MainTabs');
          },
        },
      ]
    );
  };

  return (
    <SafeScreen edges={['top']}>
      <View style={styles.container}>
        {/* Top Navigation Instruction Banner */}
        <View style={styles.navBanner}>
          <View style={styles.navIconBox}>
            <Ionicons
              name={isEnRouteToPickup ? 'person-add' : 'flag'}
              size={22}
              color={Colors.white}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.navPhase}>
              {isEnRouteToPickup ? 'HEADING TO PICKUP' : 'EN ROUTE TO DROP-OFF'}
            </Text>
            <Text style={styles.navTarget} numberOfLines={1}>
              {isEnRouteToPickup ? activeTrip.pickup.name : activeTrip.destination.name}
            </Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>{formatDuration(activeTrip.durationMinutes)}</Text>
          </View>
        </View>

        {/* Map with Live Route */}
        <WhiteThemedMap
          driverCoordinates={currentLocation}
          driverLabel="You"
          pickupCoordinates={activeTrip.pickup.coordinates}
          pickupLabel={activeTrip.pickup.name}
          destinationCoordinates={activeTrip.destination.coordinates}
          destinationLabel={activeTrip.destination.name}
          routeCoordinates={routeCoordinates}
        />

        {/* Bottom Trip Control Panel */}
        <View style={styles.bottomCard}>
          {/* Passenger Info Row */}
          <View style={styles.passengerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {activeTrip.passenger.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passengerName}>{activeTrip.passenger.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={Colors.secondary} />
                <Text style={styles.ratingText}>
                  {activeTrip.passenger.rating.toFixed(2)} • {activeTrip.paymentMethod}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.callButton} onPress={handleCallPassenger}>
              <Ionicons name="call" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Trip Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Trip Fare</Text>
              <Text style={styles.metricValue}>{formatCurrency(activeTrip.fare)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Your Net</Text>
              <Text style={[styles.metricValue, { color: Colors.success }]}>
                {formatCurrency(activeTrip.netEarning)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValue}>{formatDistance(activeTrip.distanceKm)}</Text>
            </View>
          </View>

          {/* Address Summary */}
          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>
              {isEnRouteToPickup ? 'PICKUP ADDRESS' : 'DROP-OFF ADDRESS'}
            </Text>
            <Text style={styles.addressValue} numberOfLines={2}>
              {isEnRouteToPickup ? activeTrip.pickup.address : activeTrip.destination.address}
            </Text>
          </View>

          {/* Primary Action Button */}
          {isEnRouteToPickup ? (
            <View style={styles.actionGroup}>
              <Button
                title="Arrived & Start Trip"
                variant="primary"
                onPress={startActiveTrip}
                loading={isLoadingDriver}
                icon={<Ionicons name="play" size={18} color={Colors.white} />}
              />
              <Button
                title="Cancel Trip"
                variant="outline"
                size="medium"
                onPress={handleCancel}
                disabled={isLoadingDriver}
              />
            </View>
          ) : (
            <Button
              title={`Complete Trip • Collect ${formatCurrency(activeTrip.fare)}`}
              variant="success"
              onPress={handleComplete}
              loading={isLoadingDriver}
              icon={<Ionicons name="checkmark-circle" size={20} color={Colors.white} />}
            />
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
  navBanner: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    zIndex: 30,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  navIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPhase: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A7F3D0',
    letterSpacing: 0.8,
  },
  navTarget: {
    ...Typography.h3,
    color: Colors.white,
    marginTop: 2,
  },
  etaBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  etaText: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.primary,
  },
  bottomCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    borderTopWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    ...Typography.h2,
    color: Colors.white,
  },
  passengerName: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  metricValue: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  addressBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  addressValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  actionGroup: {
    gap: 10,
  },
});

