import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { DriverProvider } from './src/context/DriverContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashIntro } from './src/components/layout/SplashIntro';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <DriverProvider>
            <StatusBar style="dark" />
            <RootNavigator />
            {showSplash && <SplashIntro onFinish={() => setShowSplash(false)} />}
          </DriverProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
