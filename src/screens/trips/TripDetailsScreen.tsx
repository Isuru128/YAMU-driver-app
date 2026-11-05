import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/common/Card';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { RideStatusHistory } from '../../types/ride';
import { formatCurrency, formatDate, formatDistance, formatDuration } from '../../utils/formatters';
import { useDriver } from '../../hooks/useDriver';

type Props = NativeStackScreenProps<RootStackParamList, 'TripDetails'>;

export const TripDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { trip } = route.params;
  const { getTripStatusHistory } = useDriver();
  const [history, setHistory] = useState<RideStatusHistory[]>([]);

  useEffect(() => {
    let active = true;
    if (!trip.id.startsWith('ride_sim_')) {
      getTripStatusHistory(trip.id).then((items) => {
        if (active) setHistory(items);
      });
    }
    return () => {
      active = false;
    };
  }, [trip.id, getTripStatusHistory]);

  const platformFee = Math.max(0, trip.fare - trip.netEarning);

  return (
    <SafeScreen>
      <AppHeader title="Trip Summary" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.sectionCard}>
          <Text style={styles.netTitle}>Driver Net Earning</Text>
          <Text style={styles.netValue}>{formatCurrency(trip.netEarning)}</Text>
          <Text style={styles.dateSub}>{formatDate(trip.createdAt)} • {trip.status}</Text>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Route Details</Text>
          <View style={styles.routeBlock}>
            <Text style={styles.label}>PICKUP</Text>
            <Text style={styles.placeName}>{trip.pickup.name}</Text>
            <Text style={styles.placeAddr}>{trip.pickup.address}</Text>
          </View>
          <View style={styles.routeBlock}>
            <Text style={styles.label}>DROP-OFF</Text>
            <Text style={styles.placeName}>{trip.destination.name}</Text>
            <Text style={styles.placeAddr}>{trip.destination.address}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>Distance: {formatDistance(trip.distanceKm)}</Text>
            <Text style={styles.statText}>Duration: {formatDuration(trip.durationMinutes)}</Text>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Fare & Commission Breakdown</Text>
          <View style={styles.lineItem}>
            <Text style={styles.lineLabel}>Passenger Trip Fare ({trip.paymentMethod})</Text>
            <Text style={styles.lineValue}>{formatCurrency(trip.fare)}</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.lineLabel}>YAMU Platform Fee (12%)</Text>
            <Text style={[styles.lineValue, { color: Colors.danger }]}>
              - {formatCurrency(platformFee)}
            </Text>
          </View>
          <View style={[styles.lineItem, styles.totalLine]}>
            <Text style={styles.totalLabel}>Your Net Payout</Text>
            <Text style={styles.totalValue}>{formatCurrency(trip.netEarning)}</Text>
          </View>
        </Card>

        {history.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Audit Timeline</Text>
            {history.map((item, idx) => (
              <View key={item.id || `${item.newStatus}-${idx}`} style={styles.timelineRow}>
                <Text style={styles.timelineStatus}>{item.newStatus}</Text>
                <Text style={styles.timelineTime}>{formatDate(item.timestamp)}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },
  sectionCard: {
    marginBottom: 2,
  },
  netTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  netValue: {
    ...Typography.h1,
    color: Colors.success,
    textAlign: 'center',
    marginVertical: 6,
  },
  dateSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionHeading: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  routeBlock: {
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  placeName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  placeAddr: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 10,
  },
  statText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lineLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  lineValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  totalLine: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  totalValue: {
    ...Typography.h3,
    color: Colors.success,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  timelineStatus: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timelineTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});

