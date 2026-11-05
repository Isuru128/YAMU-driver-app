import { paymentApiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import {
  FareEstimateRequest,
  FareEstimateResponse,
  CalculateFareRequest,
  FareBreakdown,
  PaymentResponse,
  ReceiptResponse,
} from '../types/payment';

/**
 * PaymentService connects to Fare & Payment Service (Spring Boot microservice on port 8083).
 */
export class PaymentService {
  async estimateFare(
    request: FareEstimateRequest,
    token?: string
  ): Promise<FareEstimateResponse> {
    return paymentApiClient.post<FareEstimateResponse>(ENDPOINTS.FARES.ESTIMATE, request, {
      token,
    });
  }

  async calculateFare(
    request: CalculateFareRequest,
    token?: string
  ): Promise<FareBreakdown> {
    return paymentApiClient.post<FareBreakdown>(ENDPOINTS.FARES.CALCULATE, request, {
      token,
    });
  }

  async getPaymentByRideId(rideId: string, token?: string): Promise<PaymentResponse> {
    return paymentApiClient.get<PaymentResponse>(ENDPOINTS.PAYMENTS.GET_BY_RIDE(rideId), {
      token,
    });
  }

  async getReceiptByRideId(rideId: string, token?: string): Promise<ReceiptResponse> {
    return paymentApiClient.get<ReceiptResponse>(
      ENDPOINTS.PAYMENTS.GET_RECEIPT_BY_RIDE(rideId),
      { token }
    );
  }
}

export const paymentService = new PaymentService();

