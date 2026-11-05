import React, { useRef, useMemo, useEffect } from 'react';
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
  const webViewRef = useRef<WebView | null>(null);

  const leafletHtml = useMemo(() => {
    const centerLat = driverCoordinates.latitude || DEFAULT_COORDS.latitude;
    const centerLng = driverCoordinates.longitude || DEFAULT_COORDS.longitude;

    const routeJson = JSON.stringify(
      (routeCoordinates || []).map((c) => [c.latitude, c.longitude])
    );

    const hasPickup = !!pickupCoordinates;
    const pickupLat = pickupCoordinates?.latitude || 0;
    const pickupLng = pickupCoordinates?.longitude || 0;

    const hasDest = !!destinationCoordinates;
    const destLat = destinationCoordinates?.latitude || 0;
    const destLng = destinationCoordinates?.longitude || 0;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(255, 255, 255, 0.7) !important;
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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const driverHtml = \`
      <div class="custom-pin">
        <div class="callout-pill">${driverLabel}</div>
        <div class="driver-circle"><div class="pin-core"></div></div>
      </div>
    \`;
    const driverIcon = L.divIcon({
      html: driverHtml,
      className: '',
      iconSize: [130, 52],
      iconAnchor: [65, 50]
    });
    const driverMarker = L.marker([${centerLat}, ${centerLng}], { icon: driverIcon }).addTo(map);

    if (${hasPickup}) {
      const pickupHtml = \`
        <div class="custom-pin">
          <div class="callout-pill" style="color: #059669; border-color: #10b981;">${pickupLabel}</div>
          <div class="pin-circle"><div class="pin-core"></div></div>
        </div>
      \`;
      const pickupIcon = L.divIcon({
        html: pickupHtml,
        className: '',
        iconSize: [120, 50],
        iconAnchor: [60, 48]
      });
      L.marker([${pickupLat}, ${pickupLng}], { icon: pickupIcon }).addTo(map);
    }

    if (${hasDest}) {
      const destHtml = \`
        <div class="custom-pin">
          <div class="callout-pill" style="color: #ef4444; border-color: #ef4444;">${destinationLabel}</div>
          <div class="pin-circle dest-circle"><div class="pin-core"></div></div>
        </div>
      \`;
      const destIcon = L.divIcon({
        html: destHtml,
        className: '',
        iconSize: [120, 50],
        iconAnchor: [60, 48]
      });
      L.marker([${destLat}, ${destLng}], { icon: destIcon }).addTo(map);
    }

    const routeCoords = ${routeJson};
    if (routeCoords && routeCoords.length > 1) {
      const polyline = L.polyline(routeCoords, {
        color: '#0a0a0a',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [55, 55] });
    } else if (${hasPickup} && ${hasDest}) {
      const bounds = L.latLngBounds([
        [${pickupLat}, ${pickupLng}],
        [${destLat}, ${destLng}]
      ]);
      map.fitBounds(bounds, { padding: [55, 55] });
    }

    window.recenterMap = function(lat, lng) {
      map.flyTo([lat, lng], 16, { animate: true, duration: 0.8 });
    };

    window.updateDriverPos = function(lat, lng) {
      if (driverMarker) {
        driverMarker.setLatLng([lat, lng]);
      }
    };
  </script>
</body>
</html>
    `;
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
    if (webViewRef.current && driverCoordinates?.latitude && driverCoordinates?.longitude) {
      const script = `window.updateDriverPos && window.updateDriverPos(${driverCoordinates.latitude}, ${driverCoordinates.longitude}); true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [driverCoordinates?.latitude, driverCoordinates?.longitude]);

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
          title="OpenStreetMap"
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
      <WebView
        ref={webViewRef}
        source={{ html: leafletHtml }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        startInLoadingState={true}
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
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  map: {
    flex: 1,
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
    right: 20,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
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
    zIndex: 20,
  },
});

