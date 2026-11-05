import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Coordinates } from '../types/location';
import { APP_CONFIG } from '../config/appConfig';
import { locationService } from '../services/locationService';

interface LocationContextType {
  currentLocation: Coordinates;
  currentAddress: string;
  refreshLocation: () => Promise<Coordinates>;
}

export const LocationContext = createContext<LocationContextType>({} as LocationContextType);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates>({
    latitude: APP_CONFIG.defaultMapRegion.latitude,
    longitude: APP_CONFIG.defaultMapRegion.longitude,
  });
  const [currentAddress, setCurrentAddress] = useState<string>('Colombo, Sri Lanka');

  const refreshLocation = useCallback(async (): Promise<Coordinates> => {
    try {
      const coords = await locationService.getCurrentLocation();
      setCurrentLocation(coords);
      const addr = await locationService.reverseGeocode(coords);
      if (addr) {
        setCurrentAddress(addr);
      }
      return coords;
    } catch {
      return currentLocation;
    }
  }, [currentLocation]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const coords = await locationService.getCurrentLocation();
        if (!active) return;
        setCurrentLocation(coords);
        const addr = await locationService.reverseGeocode(coords);
        if (!active) return;
        if (addr) setCurrentAddress(addr);
      } catch {
        // ignore
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        currentAddress,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

