export const ENV = {
  // Legacy / Unified Gateway URL fallback
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_ACCOUNT_SERVICE_URL || '',

  // Direct Microservice URLs
  ACCOUNT_SERVICE_URL:
    process.env.EXPO_PUBLIC_ACCOUNT_SERVICE_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:8080',
  DRIVER_SERVICE_URL:
    process.env.EXPO_PUBLIC_DRIVER_SERVICE_URL || 'http://localhost:8081',
  RIDE_SERVICE_URL:
    process.env.EXPO_PUBLIC_RIDE_SERVICE_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:8082',
  PAYMENT_SERVICE_URL:
    process.env.EXPO_PUBLIC_PAYMENT_SERVICE_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:8083',

  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || '',
  MAPS_API_KEY: process.env.EXPO_PUBLIC_MAPS_KEY || '',
  DEFAULT_COUNTRY_CODE: '+94',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

