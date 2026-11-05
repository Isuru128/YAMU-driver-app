import * as Location from 'expo-location';
import { search as searchGeoSl } from 'geo-sl/cities';
import { Coordinates, LocationPoint } from '../types/location';
import { APP_CONFIG } from '../config/appConfig';

class LocationService {
  async getCurrentLocation(): Promise<Coordinates> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          latitude: APP_CONFIG.defaultMapRegion.latitude,
          longitude: APP_CONFIG.defaultMapRegion.longitude,
        };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          return {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          };
        }
      } catch {
        // ignore
      }

      return {
        latitude: APP_CONFIG.defaultMapRegion.latitude,
        longitude: APP_CONFIG.defaultMapRegion.longitude,
      };
    }
  }

  async searchPlaces(query: string): Promise<LocationPoint[]> {
    if (!query || query.trim().length === 0) return [];
    const trimmed = query.trim();
    const results: LocationPoint[] = [];

    try {
      const geoMatches = searchGeoSl(trimmed, { limit: 5 });
      if (Array.isArray(geoMatches) && geoMatches.length > 0) {
        for (const city of geoMatches) {
          if (city.latitude && city.longitude) {
            results.push({
              id: `geo_${city.postal_code || 'na'}_${city.name_en}`,
              name: city.name_en,
              address: `${city.name_en}, ${city.district} District (${city.postal_code || ''})`,
              coordinates: {
                latitude: city.latitude,
                longitude: city.longitude,
              },
            });
          }
        }
      }
    } catch {
      // ignore
    }

    return results;
  }

  async reverseGeocode(coords: Coordinates): Promise<string> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'YAMU-Driver-App/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          const parts = data.display_name.split(',');
          return parts.slice(0, 3).join(',').trim();
        }
      }
    } catch {
      // ignore
    }

    return 'Colombo, Sri Lanka';
  }
}

export const locationService = new LocationService();

