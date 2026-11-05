import { VehicleType } from '../constants/rideConstants';

export type AvailabilityStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFFLINE';

export interface DriverVehicle {
  licensePlate: string;
  make: string;
  model: string;
  year?: number;
  color: string;
  vehicleType: VehicleType;
  capacity?: number;
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  address?: string;
  lastUpdated?: string;
}

export interface DriverResponse {
  id: string;
  userId: string;
  licenseNumber: string;
  availabilityStatus: AvailabilityStatus;
  serviceArea: string;
  currentLocation?: DriverLocation;
  vehicle: DriverVehicle;
  rating?: number;
  totalTrips?: number;
  isApproved?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterDriverRequest {
  userId?: string;
  licenseNumber: string;
  serviceArea: string;
  vehicle: DriverVehicle;
}

export interface UpdateVehicleRequest {
  licensePlate: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  vehicleType: VehicleType;
  capacity?: number;
}

export interface UpdateAvailabilityRequest {
  availabilityStatus: AvailabilityStatus;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface DriverEarningsSummary {
  todayEarnings: number;
  weekEarnings: number;
  totalEarnings: number;
  todayTrips: number;
  weekTrips: number;
  totalCompletedTrips: number;
  onlineHoursToday: number;
  walletBalance: number;
}

