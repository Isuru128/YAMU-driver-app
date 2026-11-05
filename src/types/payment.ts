import { PaymentMethod } from '../constants/rideConstants';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  totalFare: number;
  currency: string;
}

export interface FareEstimateRequest {
  distanceKm: number;
  durationMinutes: number;
  vehicleType?: string;
  surgeMultiplier?: number;
}

export interface FareEstimateResponse {
  estimatedFare: number;
  currency: string;
  fareBreakdown: FareBreakdown;
}

export interface CalculateFareRequest {
  rideId: string;
  distanceKm?: number;
  durationMinutes?: number;
  vehicleType?: string;
  surgeMultiplier?: number;
}

export interface PaymentResponse {
  id: string;
  rideId: string;
  passengerId: string;
  driverId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string;
  fareBreakdown?: FareBreakdown;
  failureReason?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface ReceiptResponse {
  id: string;
  receiptNumber: string;
  paymentId: string;
  rideId: string;
  passengerId: string;
  driverId: string;
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  fareBreakdown?: FareBreakdown;
  issuedAt: string;
}

