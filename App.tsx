import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { DriverProvider } from './src/context/DriverContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <DriverProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </DriverProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

