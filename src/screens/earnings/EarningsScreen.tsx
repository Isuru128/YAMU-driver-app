import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { formatCurrency } from '../../utils/formatters';
import { useDriver } from '../../hooks/useDriver';

export const EarningsScreen: React.FC = () => {
  const { earnings, driverProfile } = useDriver();

  const handleWithdraw = () => {
    Alert.alert(
      'Instant Bank Payout',
      `Transfer ${formatCurrency(earnings.walletBalance)} to your linked Sri Lankan bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Payout',
          onPress: () =>
            Alert.alert('Payout Initiated', 'Your funds will arrive via CEFTS within 15 minutes.'),
        },
      ]
    );
  };

  return (
    <SafeScreen>
      <AppHeader title="Earnings & Wallet" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Hero Balance Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>AVAILABLE DRIVER WALLET</Text>
          <Text style={styles.heroAmount}>{formatCurrency(earnings.walletBalance)}</Text>
          <Text style={styles.heroSub}>
            Includes cash settlements & digital wallet credits (88% driver share)
          </Text>

          <Button
            title="Cash Out to Bank Account"
            variant="secondary"
            size="medium"
            onPress={handleWithdraw}
            icon={<Ionicons name="card-outline" size={18} color={Colors.white} />}
            style={styles.withdrawBtn}
          />
        </View>

        {/* Today & This Week Cards */}
        <View style={styles.gridRow}>
          <Card style={styles.statCard}>
            <Ionicons name="sunny-outline" size={22} color={Colors.success} />
            <Text style={styles.statLabel}>Today’s Net</Text>
            <Text style={styles.statValue}>{formatCurrency(earnings.todayEarnings)}</Text>
            <Text style={styles.statMeta}>{earnings.todayTrips} completed trips</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="calendar-outline" size={22} color={Colors.info} />
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>{formatCurrency(earnings.weekEarnings)}</Text>
            <Text style={styles.statMeta}>{earnings.weekTrips} completed trips</Text>
          </Card>
        </View>

        {/* Performance Metrics */}
        <Card style={styles.metricsCard}>
          <Text style={styles.sectionTitle}>Driver Performance</Text>
          <View style={styles.perfRow}>
            <View style={styles.perfItem}>
              <Text style={styles.perfNumber}>
                {(driverProfile?.rating ?? 4.95).toFixed(2)} ★
              </Text>
              <Text style={styles.perfCaption}>Driver Rating</Text>
            </View>
            <View style={styles.perfItem}>
              <Text style={styles.perfNumber}>{earnings.totalCompletedTrips}</Text>
              <Text style={styles.perfCaption}>Lifetime Trips</Text>
            </View>
            <View style={styles.perfItem}>
              <Text style={styles.perfNumber}>{earnings.onlineHoursToday}h</Text>
              <Text style={styles.perfCaption}>Online Today</Text>
            </View>
          </View>
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
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.white,
    marginVertical: 8,
  },
  heroSub: {
    ...Typography.caption,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 16,
  },
  withdrawBtn: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  statMeta: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  metricsCard: {
    padding: 18,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  perfItem: {
    alignItems: 'center',
  },
  perfNumber: {
    ...Typography.h2,
    color: Colors.primary,
  },
  perfCaption: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

