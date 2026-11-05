export const ENDPOINTS = {
  ACCOUNTS: {
    REGISTER: '/accounts/register',
    LOGIN: '/accounts/login',
    GET_BY_ID: (id: string) => `/accounts/${id}`,
    UPDATE_PROFILE: (id: string) => `/accounts/${id}`,
  },
  DRIVERS: {
    REGISTER: '/api/v1/drivers',
    AVAILABLE: '/api/v1/drivers/available',
    GET_BY_ID: (id: string) => `/api/v1/drivers/${id}`,
    GET_BY_USER_ID: (userId: string) => `/api/v1/drivers/user/${userId}`,
    UPDATE_VEHICLE: (driverId: string) => `/api/v1/drivers/${driverId}/vehicle`,
    UPDATE_AVAILABILITY: (driverId: string) => `/api/v1/drivers/${driverId}/availability`,
    UPDATE_LOCATION: (driverId: string) => `/api/v1/drivers/${driverId}/location`,
  },
  RIDES: {
    CREATE: '/api/v1/rides',
    GET_BY_ID: (id: string) => `/api/v1/rides/${id}`,
    GET_BY_PASSENGER: (passengerId: string) => `/api/v1/rides/passenger/${passengerId}`,
    GET_BY_DRIVER: (driverId: string) => `/api/v1/rides/driver/${driverId}`,
    ASSIGN: (id: string) => `/api/v1/rides/${id}/assign`,
    ACCEPT: (id: string) => `/api/v1/rides/${id}/accept`,
    START: (id: string) => `/api/v1/rides/${id}/start`,
    COMPLETE: (id: string) => `/api/v1/rides/${id}/complete`,
    CANCEL: (id: string) => `/api/v1/rides/${id}/cancel`,
    HISTORY: (id: string) => `/api/v1/rides/${id}/history`,
  },
  FARES: {
    ESTIMATE: '/api/v1/fares/estimate',
    CALCULATE: '/api/v1/fares/calculate',
  },
  PAYMENTS: {
    PROCESS: '/api/v1/payments',
    GET_BY_ID: (id: string) => `/api/v1/payments/${id}`,
    GET_BY_RIDE: (rideId: string) => `/api/v1/payments/ride/${rideId}`,
    GET_RECEIPT_BY_ID: (id: string) => `/api/v1/payments/${id}/receipt`,
    GET_RECEIPT_BY_RIDE: (rideId: string) => `/api/v1/payments/receipts/ride/${rideId}`,
  },
};

