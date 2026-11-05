import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/common/Card';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { APP_CONFIG } from '../../config/appConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'EmergencySupport'>;

export const EmergencySupportScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeScreen>
      <AppHeader title="Emergency & Roadside" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>
          Immediate 24/7 emergency assistance and YAMU Driver Dispatch support across Sri Lanka.
        </Text>

        {APP_CONFIG.emergencyHotlines.map((item) => (
          <Card key={item.number} style={styles.hotlineCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.number}>{item.number}</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${item.number}`)}
            >
              <Ionicons name="call" size={20} color={Colors.white} />
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  hotlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  number: {
    ...Typography.h3,
    color: Colors.danger,
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

