import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { ActiveTripScreen } from '../screens/trip/ActiveTripScreen';
import { VehicleManagementScreen } from '../screens/vehicle/VehicleManagementScreen';
import { TripDetailsScreen } from '../screens/trips/TripDetailsScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { EmergencySupportScreen } from '../screens/profile/EmergencySupportScreen';
import { useAuth } from '../hooks/useAuth';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="ActiveTrip"
              component={ActiveTripScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="VehicleManagement" component={VehicleManagementScreen} />
            <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="EmergencySupport" component={EmergencySupportScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

