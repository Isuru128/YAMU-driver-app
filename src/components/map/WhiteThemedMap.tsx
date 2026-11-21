import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Coordinates } from '../../types/location';
import { ENV } from '../../config/env';

export interface WhiteThemedMapProps {
  driverCoordinates?: Coordinates;
  driverLabel?: string;
  pickupCoordinates?: Coordinates;
  pickupLabel?: string;
  destinationCoordinates?: Coordinates;
  destinationLabel?: string;
  routeCoordinates?: Coordinates[];
  onRecenter?: () => void;
  style?: object;
  children?: React.ReactNode;
}

const DEFAULT_COORDS = {
  latitude: 6.9271,
  longitude: 79.8612,
};

export const WhiteThemedMap: React.FC<WhiteThemedMapProps> = ({
  driverCoordinates = DEFAULT_COORDS,
  driverLabel = 'Your Location',
  pickupCoordinates,
  pickupLabel = 'Pickup',
  destinationCoordinates,
  destinationLabel = 'Drop-off',
  routeCoordinates,
  onRecenter,
  style,
  children,
}) => {
  const webViewRef = useRef<WebView<Record<string, unknown>> | null>(null);
  const initialCoordsRef = useRef<Coordinates>({
    latitude: driverCoordinates?.latitude || DEFAULT_COORDS.latitude,
    longitude: driverCoordinates?.longitude || DEFAULT_COORDS.longitude,
  });

  // Static HTML with Google Maps Roadmap tiles + Google Maps API key & automatic fallback
  const leafletHtml = useMemo(() => {
    const centerLat = initialCoordsRef.current.latitude;
    const centerLng = initialCoordsRef.current.longitude;
    const apiKey = ENV.MAPS_API_KEY;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #map {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background: #f8fafc;
    }
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(255, 255, 255, 0.75) !important;
    }
    .leaflet-control-zoom {
      display: none !important;
    }
    .custom-pin {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .callout-pill {
      background: #ffffff;
      color: #0f172a;
      font-weight: 700;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 12px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.18);
      white-space: nowrap;
      margin-bottom: 2px;
      border: 1px solid rgba(0,0,0,0.08);
    }
    .driver-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #0a0a0a;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pin-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #10b981;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 8px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pin-core {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ffffff;
    }
    .dest-circle {
      background: #ef4444 !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([${centerLat}, ${centerLng}], 15);

    // Primary Google Maps Roadmap layer using provided Google Maps API key
    const googleLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${apiKey}', {
      maxZoom: 20,
      attribution: '© Google Maps'
    }).addTo(map);

    let fallbackUsed = false;
    googleLayer.on('tileerror', function() {
      if (!fallbackUsed) {
        fallbackUsed = true;
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '© OpenStreetMap © CARTO'
        }).addTo(map);
      }
    });

    let driverMarker = null;
    let pickupMarker = null;
    let destMarker = null;
    let routeLine = null;

    function buildDriverIcon(label) {
      return L.divIcon({
        html: '<div class="custom-pin"><div class="callout-pill">' + label + '</div><div class="driver-circle"><div class="pin-core"></div></div></div>',
        className: '',
        iconSize: [140, 52],
        iconAnchor: [70, 50]
      });
    }

    function buildPinIcon(label, isDest) {
      const colorStyle = isDest ? 'color: #ef4444; border-color: #ef4444;' : 'color: #059669; border-color: #10b981;';
      const circleClass = isDest ? 'pin-circle dest-circle' : 'pin-circle';
      return L.divIcon({
        html: '<div class="custom-pin"><div class="callout-pill" style="' + colorStyle + '">' + label + '</div><div class="' + circleClass + '"><div class="pin-core"></div></div></div>',
        className: '',
        iconSize: [130, 50],
        iconAnchor: [65, 48]
      });
    }

    driverMarker = L.marker([${centerLat}, ${centerLng}], {
      icon: buildDriverIcon('Your Location')
    }).addTo(map);

    window.syncMapState = function(state) {
      if (!state) return;
      map.invalidateSize();

      if (state.driver && state.driver.lat && state.driver.lng) {
        if (driverMarker) {
          driverMarker.setLatLng([state.driver.lat, state.driver.lng]);
          driverMarker.setIcon(buildDriverIcon(state.driverLabel || 'Your Location'));
        } else {
          driverMarker = L.marker([state.driver.lat, state.driver.lng], {
            icon: buildDriverIcon(state.driverLabel || 'Your Location')
          }).addTo(map);
        }
      }

      if (state.pickup && state.pickup.lat && state.pickup.lng) {
        if (pickupMarker) {
          pickupMarker.setLatLng([state.pickup.lat, state.pickup.lng]);
          pickupMarker.setIcon(buildPinIcon(state.pickupLabel || 'Pickup', false));
        } else {
          pickupMarker = L.marker([state.pickup.lat, state.pickup.lng], {
            icon: buildPinIcon(state.pickupLabel || 'Pickup', false)
          }).addTo(map);
        }
      } else if (pickupMarker) {
        map.removeLayer(pickupMarker);
        pickupMarker = null;
      }

      if (state.destination && state.destination.lat && state.destination.lng) {
        if (destMarker) {
          destMarker.setLatLng([state.destination.lat, state.destination.lng]);
          destMarker.setIcon(buildPinIcon(state.destinationLabel || 'Drop-off', true));
        } else {
          destMarker = L.marker([state.destination.lat, state.destination.lng], {
            icon: buildPinIcon(state.destinationLabel || 'Drop-off', true)
          }).addTo(map);
        }
      } else if (destMarker) {
        map.removeLayer(destMarker);
        destMarker = null;
      }

      if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
      }

      if (state.route && state.route.length > 1) {
        routeLine = L.polyline(state.route, {
          color: '#0a0a0a',
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
        map.fitBounds(routeLine.getBounds(), { padding: [55, 55] });
      } else if (state.pickup && state.destination) {
        const bounds = L.latLngBounds([
          [state.pickup.lat, state.pickup.lng],
          [state.destination.lat, state.destination.lng]
        ]);
        map.fitBounds(bounds, { padding: [55, 55] });
      }
    };

    window.recenterMap = function(lat, lng) {
      map.invalidateSize();
      map.flyTo([lat, lng], 16, { animate: true, duration: 0.8 });
    };

    setTimeout(function() { map.invalidateSize(); }, 100);
    setTimeout(function() { map.invalidateSize(); }, 400);
    window.addEventListener('resize', function() { map.invalidateSize(); });
  </script>
</body>
</html>`;
  }, []);

  const syncToWebView = useCallback(() => {
    if (!webViewRef.current) return;

    const payload = {
      driver: driverCoordinates
        ? { lat: driverCoordinates.latitude, lng: driverCoordinates.longitude }
        : null,
      driverLabel,
      pickup: pickupCoordinates
        ? { lat: pickupCoordinates.latitude, lng: pickupCoordinates.longitude }
        : null,
      pickupLabel,
      destination: destinationCoordinates
        ? { lat: destinationCoordinates.latitude, lng: destinationCoordinates.longitude }
        : null,
      destinationLabel,
      route: (routeCoordinates || []).map((c) => [c.latitude, c.longitude]),
    };

    const script = `window.syncMapState && window.syncMapState(${JSON.stringify(payload)}); true;`;
    webViewRef.current.injectJavaScript(script);
  }, [
    driverCoordinates,
    driverLabel,
    pickupCoordinates,
    pickupLabel,
    destinationCoordinates,
    destinationLabel,
    routeCoordinates,
  ]);

  useEffect(() => {
    syncToWebView();
  }, [syncToWebView]);

  const handleRecenter = () => {
    if (webViewRef.current && driverCoordinates) {
      const script = `window.recenterMap && window.recenterMap(${driverCoordinates.latitude}, ${driverCoordinates.longitude}); true;`;
      webViewRef.current.injectJavaScript(script);
    }
    onRecenter?.();
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          srcDoc={leafletHtml}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="GoogleMaps"
        />
        {children}
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={handleRecenter}
          activeOpacity={0.8}
        >
          <Ionicons name="locate" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView<Record<string, unknown>>
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml, baseUrl: 'https://yamu.lk' }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        userAgent="YAMU-Driver-App/1.0 (https://yamu.lk)"
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        startInLoadingState={true}
        onLoadEnd={syncToWebView}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      />

      {children}

      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenter}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={22} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  recenterButton: {
    position: 'absolute',
    right: 18,
    top: 76,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 25,
  },
});
