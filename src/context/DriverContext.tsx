import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  DriverResponse,
  DriverVehicle,
  AvailabilityStatus,
  RegisterDriverRequest,
  UpdateVehicleRequest,
  DriverLicenseVerification,
  VerifyDriverLicenseRequest,
  DriverEarningsSummary,
} from '../types/driver';
import { DriverTripRecord, RideResponse, RideStatusHistory } from '../types/ride';
import { ReceiptResponse } from '../types/payment';
import { VehicleType, RideStatus, PaymentMethod } from '../constants/rideConstants';
import { APP_CONFIG } from '../config/appConfig';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { driverService } from '../services/driverService';
import { rideService } from '../services/rideService';
import { paymentService } from '../services/paymentService';
import { storageService } from '../services/storageService';

export interface DriverContextType {
  driverProfile: DriverResponse | null;
  vehicles: DriverVehicle[];
  activeVehicle: DriverVehicle | null;
  licenseVerification: DriverLicenseVerification | null;
  availabilityStatus: AvailabilityStatus;
  isOnline: boolean;
  isLoadingDriver: boolean;
  incomingRide: DriverTripRecord | null;
  activeTrip: DriverTripRecord | null;
  tripHistory: DriverTripRecord[];
  earnings: DriverEarningsSummary;
  toggleOnlineStatus: () => Promise<void>;
  registerOrUpdateDriverProfile: (request: RegisterDriverRequest) => Promise<DriverResponse>;
  updateDriverVehicle: (request: UpdateVehicleRequest) => Promise<DriverResponse>;
  selectActiveVehicle: (licensePlate: string) => Promise<void>;
  verifyDriverLicense: (request: VerifyDriverLicenseRequest) => Promise<DriverLicenseVerification>;
  syncDriverLocation: () => Promise<void>;
  refreshDriverData: () => Promise<void>;
  acceptIncomingRide: () => Promise<DriverTripRecord | null>;
  declineIncomingRide: () => Promise<void>;
  startActiveTrip: () => Promise<void>;
  completeActiveTrip: () => Promise<void>;
  cancelActiveTrip: (reason?: string) => Promise<void>;
  getTripReceipt: (rideId: string) => Promise<ReceiptResponse | null>;
  getTripStatusHistory: (rideId: string) => Promise<RideStatusHistory[]>;
}

export const DriverContext = createContext<DriverContextType>({} as DriverContextType);

const mapRideResponseToDriverTrip = (res: RideResponse): DriverTripRecord => {
  const fare = res.finalFare ?? res.estimatedFare ?? 0;
  const netEarning = Math.round(fare * (1 - APP_CONFIG.platformCommissionRate));

  return {
    id: res.id,
    createdAt: res.createdAt || res.requestedAt || new Date().toISOString(),
    completedAt: res.completedAt,
    pickup: {
      name: res.pickupLocation?.address?.split(',')[0] || 'Pickup Point',
      address: res.pickupLocation?.address || res.pickupLocation?.city || '',
      coordinates: {
        latitude: res.pickupLocation?.latitude ?? APP_CONFIG.defaultMapRegion.latitude,
        longitude: res.pickupLocation?.longitude ?? APP_CONFIG.defaultMapRegion.longitude,
      },
    },
    destination: {
      name: res.destinationLocation?.address?.split(',')[0] || 'Destination Point',
      address: res.destinationLocation?.address || res.destinationLocation?.city || '',
      coordinates: {
        latitude: res.destinationLocation?.latitude ?? APP_CONFIG.defaultMapRegion.latitude,
        longitude: res.destinationLocation?.longitude ?? APP_CONFIG.defaultMapRegion.longitude,
      },
    },
    vehicleType: res.requestedVehicleType || VehicleType.TUK,
    paymentMethod: PaymentMethod.CASH,
    fare,
    netEarning,
    distanceKm: res.estimatedDistanceKm ?? 0,
    durationMinutes: res.estimatedDurationMinutes ?? 0,
    status: res.status,
    passenger: {
      id: res.passengerId,
      name: `Passenger #${res.passengerId ? res.passengerId.slice(-4).toUpperCase() : ''}`.trim(),
      phone: '',
      rating: 5.0,
    },
    paymentId: res.paymentId,
  };
};

export const DriverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const { currentLocation, currentAddress } = useLocation();

  const [driverProfile, setDriverProfile] = useState<DriverResponse | null>(null);
  const [vehicles, setVehicles] = useState<DriverVehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<DriverVehicle | null>(null);
  const [licenseVerification, setLicenseVerification] =
    useState<DriverLicenseVerification | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('OFFLINE');
  const [isLoadingDriver, setIsLoadingDriver] = useState<boolean>(false);
  const [incomingRide, setIncomingRide] = useState<DriverTripRecord | null>(null);
  const [activeTrip, setActiveTrip] = useState<DriverTripRecord | null>(null);
  const [tripHistory, setTripHistory] = useState<DriverTripRecord[]>([]);

  const isOnline = availabilityStatus === 'AVAILABLE' || availabilityStatus === 'ON_TRIP';

  const refreshDriverData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingDriver(true);
    try {
      try {
        const storedLicense = await storageService.getItem(`driverLicense_${user.id}`);
        if (storedLicense) {
          setLicenseVerification(JSON.parse(storedLicense));
        }
      } catch {
        // ignore
      }

      let storedVehicles: DriverVehicle[] = [];
      try {
        const rawVehicles = await storageService.getItem(`driverVehicles_${user.id}`);
        if (rawVehicles) {
          storedVehicles = JSON.parse(rawVehicles);
        }
      } catch {
        // ignore
      }

      let profile: DriverResponse | null = null;
      try {
        profile = await driverService.getDriverByUserId(user.id, token || undefined);
        setDriverProfile(profile);
        setAvailabilityStatus(profile.availabilityStatus || 'OFFLINE');

        if (profile.vehicle) {
          setActiveVehicle(profile.vehicle);
          const exists = storedVehicles.some(
            (v) => v.licensePlate.toUpperCase() === profile!.vehicle.licensePlate.toUpperCase()
          );
          const mergedVehicles = exists
            ? storedVehicles.map((v) =>
                v.licensePlate.toUpperCase() === profile!.vehicle.licensePlate.toUpperCase()
                  ? profile!.vehicle
                  : v
              )
            : [profile.vehicle, ...storedVehicles];
          setVehicles(mergedVehicles);
        } else {
          setVehicles(storedVehicles);
          setActiveVehicle(storedVehicles[0] || null);
        }

        if (
          profile.licenseNumber &&
          !profile.licenseNumber.startsWith('PENDING-') &&
          (profile.licenseFrontImageUrl || profile.licenseExpiryDate)
        ) {
          setLicenseVerification({
            licenseNumber: profile.licenseNumber,
            expiryDate: profile.licenseExpiryDate || '',
            frontImageUrl: profile.licenseFrontImageUrl || '',
            backImageUrl: profile.licenseBackImageUrl || '',
            isVerified: true,
          });
        }
      } catch {
        setVehicles(storedVehicles);
        setActiveVehicle(storedVehicles[0] || null);
      }

      const collectedRides = new Map<string, RideResponse>();
      try {
        const byUser = await rideService.getRidesByDriver(user.id, token || undefined);
        byUser.forEach((r) => collectedRides.set(r.id, r));
      } catch {
        // ignore
      }

      if (profile?.id && profile.id !== user.id) {
        try {
          const byDriver = await rideService.getRidesByDriver(profile.id, token || undefined);
          byDriver.forEach((r) => collectedRides.set(r.id, r));
        } catch {
          // ignore
        }
      }

      const allRides = Array.from(collectedRides.values()).sort((a, b) => {
        const tA = new Date(a.createdAt || a.requestedAt || 0).getTime();
        const tB = new Date(b.createdAt || b.requestedAt || 0).getTime();
        return tB - tA;
      });

      const mapped = allRides.map((r) => mapRideResponseToDriverTrip(r));

      const assigned = mapped.find((r) => r.status === RideStatus.ASSIGNED);
      const ongoing = mapped.find(
        (r) => r.status === RideStatus.ACCEPTED || r.status === RideStatus.IN_PROGRESS
      );

      if (ongoing) {
        setActiveTrip(ongoing);
      } else if (assigned) {
        setIncomingRide(assigned);
      } else {
        setIncomingRide(null);
      }

      setTripHistory(
        mapped.filter(
          (r) => r.status === RideStatus.COMPLETED || r.status === RideStatus.CANCELLED
        )
      );
    } finally {
      setIsLoadingDriver(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    if (user?.id) {
      refreshDriverData();
    } else {
      setDriverProfile(null);
      setVehicles([]);
      setActiveVehicle(null);
      setLicenseVerification(null);
      setAvailabilityStatus('OFFLINE');
      setIncomingRide(null);
      setActiveTrip(null);
      setTripHistory([]);
    }
  }, [user?.id, refreshDriverData]);

  // Poll for assigned rides from Ride Management Service while driver is AVAILABLE
  useEffect(() => {
    if (availabilityStatus !== 'AVAILABLE' || !user?.id || activeTrip) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const rides = await rideService.getRidesByDriver(user.id, token || undefined);
        const assignedRide = rides.find((r) => r.status === RideStatus.ASSIGNED);
        if (assignedRide && (!incomingRide || incomingRide.id !== assignedRide.id)) {
          setIncomingRide(mapRideResponseToDriverTrip(assignedRide));
        }
      } catch {
        // ignore polling error
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [availabilityStatus, user?.id, token, activeTrip, incomingRide]);

  const toggleOnlineStatus = async () => {
    if (activeTrip) {
      throw new Error('Cannot go offline while you have an active trip in progress.');
    }

    const nextStatus: AvailabilityStatus =
      availabilityStatus === 'OFFLINE' ? 'AVAILABLE' : 'OFFLINE';

    if (nextStatus === 'AVAILABLE' && (!activeVehicle || !driverProfile?.id)) {
      throw new Error('Please register your vehicle before going online.');
    }

    setIsLoadingDriver(true);
    try {
      const updated = await driverService.updateAvailability(
        driverProfile!.id,
        { availabilityStatus: nextStatus },
        token || undefined
      );
      setDriverProfile(updated);
      setAvailabilityStatus(updated.availabilityStatus);

      if (nextStatus === 'AVAILABLE') {
        try {
          await driverService.updateLocation(
            driverProfile!.id,
            {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              address: currentAddress,
            },
            token || undefined
          );
        } catch {
          // ignore
        }
      } else {
        setIncomingRide(null);
      }
    } finally {
      setIsLoadingDriver(false);
    }
  };

  const upsertVehicleInList = async (vehicle: DriverVehicle) => {
    setActiveVehicle(vehicle);
    setVehicles((prev) => {
      const exists = prev.some(
        (v) => v.licensePlate.toUpperCase() === vehicle.licensePlate.toUpperCase()
      );
      const next = exists
        ? prev.map((v) =>
            v.licensePlate.toUpperCase() === vehicle.licensePlate.toUpperCase() ? vehicle : v
          )
        : [vehicle, ...prev];
      if (user?.id) {
        storageService.setItem(`driverVehicles_${user.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const registerOrUpdateDriverProfile = async (
    request: RegisterDriverRequest
  ): Promise<DriverResponse> => {
    setIsLoadingDriver(true);
    try {
      const effectiveLicenseNumber =
        request.licenseNumber?.trim() ||
        licenseVerification?.licenseNumber ||
        driverProfile?.licenseNumber ||
        `PENDING-${(user?.id || String(Date.now())).slice(-6).toUpperCase()}`;

      const created = await driverService.registerDriver(
        {
          ...request,
          userId: user?.id,
          licenseNumber: effectiveLicenseNumber,
        },
        token || undefined
      );
      setDriverProfile(created);
      setAvailabilityStatus(created.availabilityStatus || 'OFFLINE');
      if (created.vehicle) {
        await upsertVehicleInList(created.vehicle);
      }
      return created;
    } catch (err: any) {
      if (user?.id) {
        const existing = await driverService.getDriverByUserId(user.id, token || undefined);
        const updated = await driverService.updateVehicle(
          existing.id,
          request.vehicle,
          token || undefined
        );
        setDriverProfile(updated);
        if (updated.vehicle) {
          await upsertVehicleInList(updated.vehicle);
        }
        return updated;
      }
      throw err;
    } finally {
      setIsLoadingDriver(false);
    }
  };

  const updateDriverVehicle = async (request: UpdateVehicleRequest): Promise<DriverResponse> => {
    const normalizedVehicle: DriverVehicle = {
      ...request,
      color: request.color || 'White',
    };

    if (!driverProfile?.id) {
      return registerOrUpdateDriverProfile({
        serviceArea: 'Colombo',
        vehicle: normalizedVehicle,
      });
    }

    setIsLoadingDriver(true);
    try {
      const updated = await driverService.updateVehicle(
        driverProfile.id,
        request,
        token || undefined
      );
      setDriverProfile(updated);
      await upsertVehicleInList(updated.vehicle || normalizedVehicle);
      return updated;
    } finally {
      setIsLoadingDriver(false);
    }
  };

  const selectActiveVehicle = async (licensePlate: string) => {
    const target = vehicles.find(
      (v) => v.licensePlate.toUpperCase() === licensePlate.toUpperCase()
    );
    if (!target) return;
    setActiveVehicle(target);
    if (driverProfile?.id) {
      const updated = await driverService.updateVehicle(
        driverProfile.id,
        target,
        token || undefined
      );
      setDriverProfile(updated);
    }
  };

  const verifyDriverLicense = async (
    request: VerifyDriverLicenseRequest
  ): Promise<DriverLicenseVerification> => {
    setIsLoadingDriver(true);
    try {
      const verifiedRecord: DriverLicenseVerification = {
        licenseNumber: request.licenseNumber.trim().toUpperCase(),
        expiryDate: request.expiryDate.trim(),
        frontImageUrl: request.frontImageUrl,
        backImageUrl: request.backImageUrl,
        verifiedAt: new Date().toISOString(),
        isVerified: true,
      };

      if (user?.id) {
        await storageService.setItem(
          `driverLicense_${user.id}`,
          JSON.stringify(verifiedRecord)
        );
      }

      if (driverProfile?.id) {
        const updated = await driverService.updateLicense(
          driverProfile.id,
          {
            licenseNumber: verifiedRecord.licenseNumber,
            expiryDate: verifiedRecord.expiryDate,
            frontImageUrl: verifiedRecord.frontImageUrl,
            backImageUrl: verifiedRecord.backImageUrl,
          },
          token || undefined
        );
        setDriverProfile(updated);
      }

      setLicenseVerification(verifiedRecord);
      return verifiedRecord;
    } finally {
      setIsLoadingDriver(false);
    }
  };

  const syncDriverLocation = async () => {
    if (!driverProfile?.id) return;
    try {
      const updated = await driverService.updateLocation(
        driverProfile.id,
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: currentAddress,
        },
        token || undefined
      );
      setDriverProfile(updated);
    } catch {
      // ignore
    }
  };

  const acceptIncomingRide = async (): Promise<DriverTripRecord | null> => {
    if (!incomingRide) return null;
    setIsLoadingDriver(true);
    try {
      const res = await rideService.acceptRide(incomingRide.id, token || undefined);
      const acceptedTrip = mapRideResponseToDriverTrip(res);
      setActiveTrip(acceptedTrip);
      setIncomingRide(null);
      return acceptedTrip;
    } finally {
      setIsLoadingDriver(false);
    }
  };

  const declineIncomingRide = async () => {
    if (!incomingRide) return;
    setIsLoadingDriver(true);
    try {
      await rideService.cancelRide(
        incomingRide.id,
        { cancellationReason: 'Declined by driver' },
        token || undefined
      );
      setIncomingRide(null);
    } finally {
      setIsLoadingDriver(false);
    }
  };

  const startActiveTrip = async () => {
    if (!activeTrip) return;
    setIsLoadingDriver(true);
    try {
      const res = await rideService.startRide(activeTrip.id, token || undefined);
      setActiveTrip(mapRideResponseToDriverTrip(res));
      setAvailabilityStatus('ON_TRIP');
    } finally {
      setIsLoadingDriver(false);
    }
  };

  const completeActiveTrip = async () => {
    if (!activeTrip) return;
    setIsLoadingDriver(true);
    try {
      const res = await rideService.completeRide(
        activeTrip.id,
        {
          actualDistanceKm: activeTrip.distanceKm,
          actualDurationMinutes: activeTrip.durationMinutes,
          finalFare: activeTrip.fare,
        },
        token || undefined
      );

      const completedRecord = mapRideResponseToDriverTrip(res);
      setTripHistory((prev) => [completedRecord, ...prev]);
      setActiveTrip(null);
      setAvailabilityStatus('AVAILABLE');
    } finally {
      setIsLoadingDriver(false);
    }
  };

  const cancelActiveTrip = async (reason: string = 'Cancelled by driver') => {
    if (!activeTrip) return;
    setIsLoadingDriver(true);
    try {
      const res = await rideService.cancelRide(
        activeTrip.id,
        { cancellationReason: reason },
        token || undefined
      );
      const cancelledRecord = mapRideResponseToDriverTrip(res);
      setTripHistory((prev) => [cancelledRecord, ...prev]);
      setActiveTrip(null);
      setAvailabilityStatus('AVAILABLE');
    } finally {
      setIsLoadingDriver(false);
    }
  };

  const getTripReceipt = async (rideId: string): Promise<ReceiptResponse | null> => {
    try {
      return await paymentService.getReceiptByRideId(rideId, token || undefined);
    } catch {
      return null;
    }
  };

  const getTripStatusHistory = async (rideId: string): Promise<RideStatusHistory[]> => {
    try {
      return await rideService.getRideHistory(rideId, token || undefined);
    } catch {
      return [];
    }
  };

  const earnings: DriverEarningsSummary = useMemo(() => {
    const completed = tripHistory.filter((t) => t.status === RideStatus.COMPLETED);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;

    let todayEarnings = 0;
    let weekEarnings = 0;
    let totalEarnings = 0;
    let todayTrips = 0;
    let weekTrips = 0;
    let todayMinutes = 0;

    for (const trip of completed) {
      const ts = new Date(trip.completedAt || trip.createdAt).getTime();
      const net = trip.netEarning || Math.round(trip.fare * (1 - APP_CONFIG.platformCommissionRate));
      totalEarnings += net;
      if (ts >= startOfWeek) {
        weekEarnings += net;
        weekTrips += 1;
      }
      if (ts >= startOfToday) {
        todayEarnings += net;
        todayTrips += 1;
        todayMinutes += trip.durationMinutes || 0;
      }
    }

    return {
      todayEarnings,
      weekEarnings,
      totalEarnings,
      todayTrips,
      weekTrips,
      totalCompletedTrips: driverProfile?.totalTrips ?? completed.length,
      onlineHoursToday: Number((todayMinutes / 60).toFixed(1)),
      walletBalance: totalEarnings,
    };
  }, [tripHistory, driverProfile?.totalTrips]);

  return (
    <DriverContext.Provider
      value={{
        driverProfile,
        vehicles,
        activeVehicle,
        licenseVerification,
        availabilityStatus,
        isOnline,
        isLoadingDriver,
        incomingRide,
        activeTrip,
        tripHistory,
        earnings,
        toggleOnlineStatus,
        registerOrUpdateDriverProfile,
        updateDriverVehicle,
        selectActiveVehicle,
        verifyDriverLicense,
        syncDriverLocation,
        refreshDriverData,
        acceptIncomingRide,
        declineIncomingRide,
        startActiveTrip,
        completeActiveTrip,
        cancelActiveTrip,
        getTripReceipt,
        getTripStatusHistory,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
};
