import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
import { RideStatus } from '../../constants/rideConstants';
import { formatCurrency, formatDate, formatDistance } from '../../utils/formatters';
import { useDriver } from '../../hooks/useDriver';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Trips'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const TripsScreen: React.FC<Props> = ({ navigation }) => {
  const { tripHistory, refreshDriverData, isLoadingDriver } = useDriver();
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const filteredTrips = tripHistory.filter((t) => {
    if (filter === 'COMPLETED') return t.status === RideStatus.COMPLETED;
    if (filter === 'CANCELLED') return t.status === RideStatus.CANCELLED;
    return true;
  });

  return (
    <SafeScreen>
      <AppHeader
        title="Driver Trips"
        rightAction={
          <TouchableOpacity onPress={refreshDriverData}>
            <Ionicons name="refresh" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.filterBar}>
        {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map((tab) => {
          const active = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredTrips}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
        contentContainerStyle={styles.listContent}
        refreshing={isLoadingDriver}
        onRefresh={refreshDriverData}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-sport-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No driver trips yet</Text>
            <Text style={styles.emptySub}>
              Go online on the Drive tab to accept passenger requests and view your completed rides here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCompleted = item.status === RideStatus.COMPLETED;
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('TripDetails', { trip: item })}
            >
              <Card style={styles.tripCard}>
                <View style={styles.cardTop}>
                  <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isCompleted ? styles.statusCompleted : styles.statusCancelled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isCompleted ? styles.statusTextCompleted : styles.statusTextCancelled,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeSection}>
                  <View style={styles.routeLineRow}>
                    <View style={styles.dotGreen} />
                    <Text style={styles.placeText} numberOfLines={1}>
                      {item.pickup.name}
                    </Text>
                  </View>
                  <View style={styles.routeLineRow}>
                    <View style={styles.dotRed} />
                    <Text style={styles.placeText} numberOfLines={1}>
                      {item.destination.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.metaText}>
                    {formatDistance(item.distanceKm)} • {item.passenger.name}
                  </Text>
                  <View style={styles.earningRow}>
                    <Text style={styles.netLabel}>Net:</Text>
                    <Text style={styles.netAmount}>{formatCurrency(item.netEarning)}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  tripCard: {
    marginBottom: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextCompleted: {
    color: '#15803D',
  },
  statusTextCancelled: {
    color: '#B91C1C',
  },
  routeSection: {
    gap: 8,
    marginBottom: 12,
  },
  routeLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  dotRed: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: Colors.danger,
  },
  placeText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 10,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  netLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  netAmount: {
    ...Typography.bodyBold,
    color: Colors.success,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 28,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
});

