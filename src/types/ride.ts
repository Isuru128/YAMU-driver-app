import { LocationPoint } from './location';
import { VehicleType, RideStatus, PaymentMethod } from '../constants/rideConstants';

export interface RideLocation {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
}

export interface RideResponse {
  id: string;
  passengerId: string;
  driverId?: string;
  pickupLocation: RideLocation;
  destinationLocation: RideLocation;
  requestedVehicleType: VehicleType;
  status: RideStatus;
  estimatedDistanceKm?: number;
  estimatedDurationMinutes?: number;
  estimatedFare?: number;
  finalFare?: number;
  paymentId?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  requestedAt?: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignDriverRequest {
  driverId: string;
}

export interface CompleteRideRequest {
  actualDistanceKm?: number;
  actualDurationMinutes?: number;
  finalFare?: number;
  paymentId?: string;
}

export interface CancelRideRequest {
  cancellationReason: string;
}

export interface RideStatusHistory {
  id?: string;
  rideId: string;
  previousStatus?: RideStatus | null;
  newStatus: RideStatus;
  changedBy?: string;
  reason?: string;
  timestamp: string;
}

export interface PassengerInfo {
  id: string;
  name: string;
  phone: string;
  rating: number;
}

export interface DriverTripRecord {
  id: string;
  createdAt: string;
  completedAt?: string;
  pickup: LocationPoint;
  destination: LocationPoint;
  vehicleType: VehicleType;
  paymentMethod: PaymentMethod;
  fare: number;
  netEarning: number;
  distanceKm: number;
  durationMinutes: number;
  status: RideStatus;
  passenger: PassengerInfo;
  paymentId?: string;
}

