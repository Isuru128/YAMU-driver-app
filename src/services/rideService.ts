import { rideApiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import {
  RideResponse,
  AssignDriverRequest,
  CompleteRideRequest,
  CancelRideRequest,
  RideStatusHistory,
} from '../types/ride';

/**
 * RideService connects to Ride Management Service (Spring Boot microservice on port 8082).
 * Handles driver trip assignment, acceptance, start, completion, cancellation, and history.
 */
export class RideService {
  /**
   * Retrieve real-time status and metadata of a ride
   * GET /api/v1/rides/{id}
   */
  async getRideById(rideId: string, token?: string): Promise<RideResponse> {
    return rideApiClient.get<RideResponse>(ENDPOINTS.RIDES.GET_BY_ID(rideId), { token });
  }

  /**
   * Retrieve all rides assigned to a specific driver ID
   * GET /api/v1/rides/driver/{driverId}
   */
  async getRidesByDriver(driverId: string, token?: string): Promise<RideResponse[]> {
    return rideApiClient.get<RideResponse[]>(ENDPOINTS.RIDES.GET_BY_DRIVER(driverId), {
      token,
    });
  }

  /**
   * Assign a driver to a REQUESTED ride
   * POST /api/v1/rides/{id}/assign
   */
  async assignDriver(
    rideId: string,
    request: AssignDriverRequest,
    token?: string
  ): Promise<RideResponse> {
    return rideApiClient.post<RideResponse>(ENDPOINTS.RIDES.ASSIGN(rideId), request, { token });
  }

  /**
   * Accept an ASSIGNED ride
   * PATCH /api/v1/rides/{id}/accept
   * Access: DRIVER / ADMIN
   */
  async acceptRide(rideId: string, token?: string): Promise<RideResponse> {
    return rideApiClient.patch<RideResponse>(ENDPOINTS.RIDES.ACCEPT(rideId), undefined, {
      token,
    });
  }

  /**
   * Start an ACCEPTED ride once passenger is picked up
   * PATCH /api/v1/rides/{id}/start
   * Access: DRIVER / ADMIN
   */
  async startRide(rideId: string, token?: string): Promise<RideResponse> {
    return rideApiClient.patch<RideResponse>(ENDPOINTS.RIDES.START(rideId), undefined, {
      token,
    });
  }

  /**
   * Complete an IN_PROGRESS ride at drop-off
   * PATCH /api/v1/rides/{id}/complete
   * Access: DRIVER / ADMIN
   */
  async completeRide(
    rideId: string,
    request?: CompleteRideRequest,
    token?: string
  ): Promise<RideResponse> {
    return rideApiClient.patch<RideResponse>(ENDPOINTS.RIDES.COMPLETE(rideId), request || {}, {
      token,
    });
  }

  /**
   * Cancel an active ride before trip start
   * PATCH /api/v1/rides/{id}/cancel
   */
  async cancelRide(
    rideId: string,
    request: CancelRideRequest,
    token?: string
  ): Promise<RideResponse> {
    return rideApiClient.patch<RideResponse>(ENDPOINTS.RIDES.CANCEL(rideId), request, { token });
  }

  /**
   * Retrieve immutable state transition audit history for a ride
   * GET /api/v1/rides/{id}/history
   */
  async getRideHistory(rideId: string, token?: string): Promise<RideStatusHistory[]> {
    return rideApiClient.get<RideStatusHistory[]>(ENDPOINTS.RIDES.HISTORY(rideId), { token });
  }
}

export const rideService = new RideService();

