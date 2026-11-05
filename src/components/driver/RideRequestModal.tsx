import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DriverTripRecord } from '../../types/ride';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { formatCurrency, formatDistance, formatDuration } from '../../utils/formatters';
import { Button } from '../common/Button';

interface RideRequestModalProps {
  offer: DriverTripRecord;
  loading?: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const RideRequestModal: React.FC<RideRequestModalProps> = ({
  offer,
  loading = false,
  onAccept,
  onDecline,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons name="flash" size={14} color={Colors.white} />
          <Text style={styles.badgeText}>NEW RIDE REQUEST</Text>
        </View>
        <Text style={styles.vehicleBadge}>{offer.vehicleType}</Text>
      </View>

      {/* Fare & Net Earnings */}
      <View style={styles.fareContainer}>
        <View>
          <Text style={styles.fareLabel}>Est. Trip Fare ({offer.paymentMethod})</Text>
          <Text style={styles.fareValue}>{formatCurrency(offer.fare)}</Text>
        </View>
        <View style={styles.netBox}>
          <Text style={styles.netLabel}>Your Net Earning</Text>
          <Text style={styles.netValue}>{formatCurrency(offer.netEarning)}</Text>
        </View>
      </View>

      {/* Distance & Duration Chips */}
      <View style={styles.metricsRow}>
        <View style={styles.metricChip}>
          <Ionicons name="navigate-outline" size={16} color={Colors.primary} />
          <Text style={styles.metricText}>{formatDistance(offer.distanceKm)}</Text>
        </View>
        <View style={styles.metricChip}>
          <Ionicons name="time-outline" size={16} color={Colors.primary} />
          <Text style={styles.metricText}>{formatDuration(offer.durationMinutes)}</Text>
        </View>
        <View style={styles.metricChip}>
          <Ionicons name="star" size={15} color={Colors.secondary} />
          <Text style={styles.metricText}>
            {offer.passenger.name} ({offer.passenger.rating.toFixed(1)})
          </Text>
        </View>
      </View>

      {/* Route Details */}
      <View style={styles.routeBox}>
        <View style={styles.routeRow}>
          <View style={styles.dotPickup} />
          <View style={styles.routeTextWrap}>
            <Text style={styles.routeLabel}>PICKUP</Text>
            <Text style={styles.routeName} numberOfLines={1}>
              {offer.pickup.name}
            </Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {offer.pickup.address}
            </Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routeRow}>
          <View style={styles.dotDest} />
          <View style={styles.routeTextWrap}>
            <Text style={styles.routeLabel}>DROP-OFF</Text>
            <Text style={styles.routeName} numberOfLines={1}>
              {offer.destination.name}
            </Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {offer.destination.address}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Button
          title="Decline"
          variant="outline"
          onPress={onDecline}
          disabled={loading}
          style={styles.declineBtn}
        />
        <Button
          title="Accept Ride"
          variant="success"
          onPress={onAccept}
          loading={loading}
          style={styles.acceptBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  vehicleBadge: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fareLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  fareValue: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  netBox: {
    alignItems: 'flex-end',
  },
  netLabel: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '600',
  },
  netValue: {
    ...Typography.h3,
    color: Colors.success,
    fontWeight: '800',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  metricText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  routeBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    marginTop: 5,
  },
  dotDest: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: Colors.danger,
    marginTop: 5,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  routeName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  routeAddress: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
  },
  acceptBtn: {
    flex: 2,
  },
});

