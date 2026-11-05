import { driverApiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import {
  DriverResponse,
  RegisterDriverRequest,
  UpdateVehicleRequest,
  UpdateAvailabilityRequest,
  UpdateLocationRequest,
} from '../types/driver';
import { VehicleType } from '../constants/rideConstants';

/**
 * DriverService connects to Driver & Vehicle Service (Spring Boot microservice on port 8081).
 * Handles driver operational profile registration, vehicle management, availability toggling,
 * and live GPS location updates.
 */
export class DriverService {
  /**
   * Register driver operational profile & vehicle
   * POST /api/v1/drivers
   * Access: DRIVER / ADMIN
   */
  async registerDriver(
    request: RegisterDriverRequest,
    token?: string
  ): Promise<DriverResponse> {
    return driverApiClient.post<DriverResponse>(ENDPOINTS.DRIVERS.REGISTER, request, {
      token,
    });
  }

  /**
   * Retrieve driver operational profile by driver ID
   * GET /api/v1/drivers/{driverId}
   */
  async getDriverById(driverId: string, token?: string): Promise<DriverResponse> {
    return driverApiClient.get<DriverResponse>(ENDPOINTS.DRIVERS.GET_BY_ID(driverId), {
      token,
    });
  }

  /**
   * Find driver operational profile by user account ID
   * GET /api/v1/drivers/user/{userId}
   */
  async getDriverByUserId(userId: string, token?: string): Promise<DriverResponse> {
    return driverApiClient.get<DriverResponse>(ENDPOINTS.DRIVERS.GET_BY_USER_ID(userId), {
      token,
    });
  }

  /**
   * Update driver's registered vehicle details
   * PUT /api/v1/drivers/{driverId}/vehicle
   * Access: DRIVER / ADMIN
   */
  async updateVehicle(
    driverId: string,
    request: UpdateVehicleRequest,
    token?: string
  ): Promise<DriverResponse> {
    return driverApiClient.put<DriverResponse>(
      ENDPOINTS.DRIVERS.UPDATE_VEHICLE(driverId),
      request,
      { token }
    );
  }

  /**
   * Toggle driver online/offline availability status
   * PATCH /api/v1/drivers/{driverId}/availability
   * Access: DRIVER / ADMIN
   */
  async updateAvailability(
    driverId: string,
    request: UpdateAvailabilityRequest,
    token?: string
  ): Promise<DriverResponse> {
    return driverApiClient.patch<DriverResponse>(
      ENDPOINTS.DRIVERS.UPDATE_AVAILABILITY(driverId),
      request,
      { token }
    );
  }

  /**
   * Update driver's real-time GPS coordinates
   * PATCH /api/v1/drivers/{driverId}/location
   * Access: DRIVER / ADMIN
   */
  async updateLocation(
    driverId: string,
    request: UpdateLocationRequest,
    token?: string
  ): Promise<DriverResponse> {
    return driverApiClient.patch<DriverResponse>(
      ENDPOINTS.DRIVERS.UPDATE_LOCATION(driverId),
      request,
      { token }
    );
  }

  /**
   * Query available drivers by service area & vehicle type
   * GET /api/v1/drivers/available
   */
  async getAvailableDrivers(
    serviceArea?: string,
    vehicleType?: VehicleType | string,
    token?: string
  ): Promise<DriverResponse[]> {
    const params = new URLSearchParams();
    if (serviceArea) params.append('serviceArea', serviceArea);
    if (vehicleType) params.append('vehicleType', vehicleType);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return driverApiClient.get<DriverResponse[]>(
      `${ENDPOINTS.DRIVERS.AVAILABLE}${queryString}`,
      { token }
    );
  }
}

export const driverService = new DriverService();

