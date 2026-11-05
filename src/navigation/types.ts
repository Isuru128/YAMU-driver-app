import { DriverTripRecord } from '../types/ride';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OtpVerification: { phoneNumber: string };
};

export type MainTabParamList = {
  Home: undefined;
  Trips: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  ActiveTrip: undefined;
  VehicleManagement: undefined;
  TripDetails: { trip: DriverTripRecord };
  EditProfile: undefined;
  EmergencySupport: undefined;
};

