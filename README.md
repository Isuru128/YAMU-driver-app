# YAMU Driver App (React Native / Expo)

Mobile application for **YAMU Driver Partners** in Sri Lanka, built with React Native, Expo, and TypeScript. Connects directly to the YAMU Spring Boot Microservices backend (`account-service`, `driver-and-vehicle-service`, `ride-management-service`, and `payment-service`).

## Key Features
- **Driver Partner Authentication**: Email/password (`role: 'DRIVER'`) and Sri Lankan Phone OTP authentication via `account-service` (`/accounts/register`, `/accounts/login`).
- **Driver & Vehicle Onboarding**: Register and manage driving license number, service area (Colombo, Kandy, Galle, etc.), and vehicle details (`TUK`, `BIKE`, `CAR`, `VAN`) via `driver-and-vehicle-service` (`/api/v1/drivers`).
- **Online / Offline Radar & Live GPS Sync**: Toggle availability (`AVAILABLE` / `OFFLINE` / `ON_TRIP`) and broadcast real-time GPS coordinates (`/api/v1/drivers/{id}/availability`, `/api/v1/drivers/{id}/location`).
- **Full Trip Lifecycle Execution**: Receive incoming ride offers, view OSRM turn-by-turn routes on OpenStreetMap, accept rides (`/api/v1/rides/{id}/accept`), start trips (`/api/v1/rides/{id}/start`), and complete rides (`/api/v1/rides/{id}/complete`).
- **Earnings & Wallet Dashboard**: Real-time daily & weekly net earnings (88% driver share after 12% platform fee), trip history, and bank payout requests.

## Getting Started
```bash
cd "YAMU-driver app"
npm install
npx expo start
```

