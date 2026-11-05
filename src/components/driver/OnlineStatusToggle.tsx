import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { AvailabilityStatus } from '../../types/driver';

interface OnlineStatusToggleProps {
  status: AvailabilityStatus;
  loading?: boolean;
  onToggle: () => void;
}

export const OnlineStatusToggle: React.FC<OnlineStatusToggleProps> = ({
  status,
  loading = false,
  onToggle,
}) => {
  const isOnline = status === 'AVAILABLE' || status === 'ON_TRIP';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onToggle}
      disabled={loading || status === 'ON_TRIP'}
      style={[
        styles.pill,
        isOnline ? styles.pillOnline : styles.pillOffline,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.white} />
      ) : (
        <>
          <View style={[styles.dot, isOnline ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.statusText}>
            {status === 'ON_TRIP' ? 'ON TRIP' : isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
          <Ionicons
            name={isOnline ? 'power' : 'radio-button-off'}
            size={18}
            color={Colors.white}
          />
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 28,
    gap: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  pillOnline: {
    backgroundColor: Colors.success,
  },
  pillOffline: {
    backgroundColor: Colors.primary,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  dotOnline: {
    backgroundColor: '#D1FAE5',
  },
  dotOffline: {
    backgroundColor: Colors.danger,
  },
  statusText: {
    ...Typography.bodyBold,
    color: Colors.white,
    letterSpacing: 0.8,
  },
});

