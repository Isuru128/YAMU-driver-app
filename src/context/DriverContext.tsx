import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  DriverResponse,
  DriverVehicle,
  AvailabilityStatus,
  RegisterDriverRequest,
  UpdateVehicleRequest,
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

export interface AddVehicleInput {
  licenseNumber: string;
  serviceArea: string;
  vehicle: DriverVehicle;
  setAsActive?: boolean;
}

export interface DriverContextType {
  driverProfile: DriverResponse | null;
  vehicles: DriverVehicle[];
  activeVehicle: DriverVehicle | null;
  availabilityStatus: AvailabilityStatus;
  isOnline: boolean;
  isLoadingDriver: boolean;
  incomingRide: DriverTripRecord | null;
  activeTrip: DriverTripRecord | null;
  tripHistory: DriverTripRecord[];
  earnings: DriverEarningsSummary;
  toggleOnlineStatus: () => Promise<void>;
  addDriverVehicle: (input: AddVehicleInput) => Promise<DriverResponse>;
  selectActiveVehicle: (vehicleIdOrPlate: string) => Promise<void>;
  removeDriverVehicle: (vehicleIdOrPlate: string) => Promise<void>;
  registerOrUpdateDriverProfile: (request: RegisterDriverRequest) => Promise<DriverResponse>;
  updateDriverVehicle: (request: UpdateVehicleRequest) => Promise<DriverResponse>;
  syncDriverLocation: () => Promise<void>;
  refreshDriverData: () => Promise<void>;
  simulateIncomingRide: () => void;
  acceptIncomingRide: () => Promise<DriverTripRecord | null>;
  declineIncomingRide: () => Promise<void>;
  startActiveTrip: () => Promise<void>;
  completeActiveTrip: () => Promise<void>;
  cancelActiveTrip: (reason?: string) => Promise<void>;
  getTripReceipt: (rideId: string) => Promise<ReceiptResponse | null>;
  getTripStatusHistory: (rideId: string) => Promise<RideStatusHistory[]>;
}

export const DriverContext = createContext<DriverContextType>({} as DriverContextType);

const SAMPLE_PASSENGERS = [
  { id: 'psg_101', name: 'Nimali Fernando', phone: '+94772345678', rating: 4.92 },
  { id: 'psg_102', name: 'Kasun Jayawardena', phone: '+94718765432', rating: 4.88 },
  { id: 'psg_103', name: 'Dilani Bandara', phone: '+94763456789', rating: 5.0 },
  { id: 'psg_104', name: 'Roshan De Silva', phone: '+94779988776', rating: 4.95 },
];

const SAMPLE_ROUTES = [
  {
    pickup: {
      name: 'One Galle Face Mall',
      address: '1A Centre Road, Colombo 02',
      coordinates: { latitude: 6.9272, longitude: 79.8466 },
    },
    destination: {
      name: 'Independence Square',
      address: 'Independence Ave, Colombo 07',
      coordinates: { latitude: 6.9044, longitude: 79.8679 },
    },
    distanceKm: 4.2,
    durationMinutes: 14,
    fare: 520,
  },
  {
    pickup: {
      name: 'Colombo Fort Railway Station',
      address: 'Olcott Mawatha, Colombo 01',
      coordinates: { latitude: 6.9344, longitude: 79.8504 },
    },
    destination: {
      name: 'Majestic City, Bambalapitiya',
      address: 'Galle Road, Colombo 04',
      coordinates: { latitude: 6.8942, longitude: 79.8553 },
    },
    distanceKm: 5.6,
    durationMinutes: 18,
    fare: 680,
  },
  {
    pickup: {
      name: 'Lotus Tower Colombo',
      address: 'D.R. Wijewardena Mawatha, Colombo 10',
      coordinates: { latitude: 6.9288, longitude: 79.8583 },
    },
    destination: {
      name: 'Galle Face Green',
      address: 'Galle Main Road, Colombo 03',
      coordinates: { latitude: 6.9248, longitude: 79.8447 },
    },
    distanceKm: 2.8,
    durationMinutes: 10,
    fare: 390,
  },
];

const mapRideResponseToDriverTrip = (res: RideResponse, index: number = 0): DriverTripRecord => {
  const fare = res.finalFare ?? res.estimatedFare ?? 450;
  const netEarning = Math.round(fare * (1 - APP_CONFIG.platformCommissionRate));
  const passenger = SAMPLE_PASSENGERS[index % SAMPLE_PASSENGERS.length];

  return {
    id: res.id,
    createdAt: res.createdAt || res.requestedAt || new Date().toISOString(),
    completedAt: res.completedAt,
    pickup: {
      name: res.pickupLocation?.address?.split(',')[0] || 'Pickup Point',
      address: res.pickupLocation?.address || res.pickupLocation?.city || 'Colombo',
      coordinates: {
        latitude: res.pickupLocation?.latitude ?? 6.9271,
        longitude: res.pickupLocation?.longitude ?? 79.8612,
      },
    },
    destination: {
      name: res.destinationLocation?.address?.split(',')[0] || 'Destination Point',
      address: res.destinationLocation?.address || res.destinationLocation?.city || 'Colombo',
      coordinates: {
        latitude: res.destinationLocation?.latitude ?? 6.9044,
        longitude: res.destinationLocation?.longitude ?? 79.8679,
      },
    },
    vehicleType: res.requestedVehicleType || VehicleType.TUK,
    paymentMethod: PaymentMethod.CASH,
    fare,
    netEarning,
    distanceKm: res.estimatedDistanceKm ?? 4.5,
    durationMinutes: res.estimatedDurationMinutes ?? 15,
    status: res.status,
    passenger: {
      ...passenger,
      id: res.passengerId || passenger.id,
    },
    paymentId: res.paymentId,
  };
};

const normalizeVehicleId = (vehicle: DriverVehicle): string =>
  vehicle.id || `veh_${vehicle.licensePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`;

export const DriverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const { currentLocation, currentAddress } = useLocation();

  const [driverProfile, setDriverProfile] = useState<DriverResponse | null>(null);
  const [vehicles, setVehicles] = useState<DriverVehicle[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('OFFLINE');
  const [isLoadingDriver, setIsLoadingDriver] = useState<boolean>(false);
  const [incomingRide, setIncomingRide] = useState<DriverTripRecord | null>(null);
  const [activeTrip, setActiveTrip] = useState<DriverTripRecord | null>(null);
  const [tripHistory, setTripHistory] = useState<DriverTripRecord[]>([]);

  const isOnline = availabilityStatus === 'AVAILABLE' || availabilityStatus === 'ON_TRIP';

  const activeVehicle: DriverVehicle | null = useMemo(() => {
    const activeFromList = vehicles.find((v) => v.isActive);
    if (activeFromList) return activeFromList;
    if (vehicles.length > 0) return vehicles[0];
    return driverProfile?.vehicle || null;
  }, [vehicles, driverProfile?.vehicle]);

  const persistVehicles = useCallback(
    async (nextVehicles: DriverVehicle[], nextProfile?: DriverResponse | null) => {
      if (!user?.id) return;
      await storageService.setItem(`yamu_driver_vehicles_${user.id}`, JSON.stringify(nextVehicles));
      if (nextProfile) {
        await storageService.setItem(
          `yamu_driver_profile_${user.id}`,
          JSON.stringify(nextProfile)
        );
      }
    },
    [user?.id]
  );

  const refreshDriverData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingDriver(true);
    try {
      // Load locally persisted vehicles & profile fallback
      let storedVehicles: DriverVehicle[] = [];
      try {
        const rawVehicles = await storageService.getItem(`yamu_driver_vehicles_${user.id}`);
        if (rawVehicles) {
          storedVehicles = JSON.parse(rawVehicles);
        }
      } catch {
        // ignore parse warning
      }

      let profile: DriverResponse | null = null;
      try {
        profile = await driverService.getDriverByUserId(user.id, token || undefined);
      } catch {
        // Driver operational profile may not be registered yet in backend; check local storage
        try {
          const rawProfile = await storageService.getItem(`yamu_driver_profile_${user.id}`);
          if (rawProfile) {
            profile = JSON.parse(rawProfile);
          }
        } catch {
          // ignore
        }
      }

      // Reconcile backend profile vehicle with multi-vehicle list (ensuring only ONE active vehicle)
      let mergedVehicles = [...storedVehicles];
      if (profile?.vehicle?.licensePlate) {
        const backendVeh: DriverVehicle = {
          ...profile.vehicle,
          id: normalizeVehicleId(profile.vehicle),
        };
        const existsIdx = mergedVehicles.findIndex(
          (v) => v.licensePlate.toUpperCase() === backendVeh.licensePlate.toUpperCase()
        );
        if (existsIdx === -1) {
          const hasAnyActive = mergedVehicles.some((v) => v.isActive);
          mergedVehicles.push({
            ...backendVeh,
            isActive: !hasAnyActive,
          });
        }
      }

      // Ensure exactly one vehicle is marked active if there are any vehicles
      if (mergedVehicles.length > 0) {
        let activeIdx = mergedVehicles.findIndex((v) => v.isActive);
        if (activeIdx === -1) {
          activeIdx = 0;
        }
        mergedVehicles = mergedVehicles.map((v, idx) => ({
          ...v,
          id: normalizeVehicleId(v),
          isActive: idx === activeIdx,
        }));
      }

      setVehicles(mergedVehicles);

      if (profile) {
        const currentActive = mergedVehicles.find((v) => v.isActive) || profile.vehicle;
        const syncedProfile: DriverResponse = {
          ...profile,
          vehicle: currentActive,
        };
        setDriverProfile(syncedProfile);
        setAvailabilityStatus(syncedProfile.availabilityStatus || 'OFFLINE');
        await persistVehicles(mergedVehicles, syncedProfile);
      } else if (mergedVehicles.length > 0) {
        await persistVehicles(mergedVehicles);
      }

      // Fetch driver rides by userId and by driverProfile.id
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

      const mapped = allRides.map((r, idx) => mapRideResponseToDriverTrip(r, idx));

      // Check if there is an assigned or active ride
      const assigned = mapped.find((r) => r.status === RideStatus.ASSIGNED);
      const ongoing = mapped.find(
        (r) => r.status === RideStatus.ACCEPTED || r.status === RideStatus.IN_PROGRESS
      );

      if (ongoing) {
        setActiveTrip(ongoing);
      } else if (assigned) {
        setIncomingRide(assigned);
      }

      setTripHistory(
        mapped.filter(
          (r) => r.status === RideStatus.COMPLETED || r.status === RideStatus.CANCELLED
        )
      );
    } finally {
      setIsLoadingDriver(false);
    }
  }, [user?.id, token, persistVehicles]);

  useEffect(() => {
    if (user?.id) {
      refreshDriverData();
    } else {
      setDriverProfile(null);
      setVehicles([]);
      setAvailabilityStatus('OFFLINE');
      setIncomingRide(null);
      setActiveTrip(null);
      setTripHistory([]);
    }
  }, [user?.id, refreshDriverData]);

  // Poll for newly assigned rides while driver is AVAILABLE
  useEffect(() => {
    if (availabilityStatus !== 'AVAILABLE' || !user?.id || activeTrip) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const rides = await rideService.getRidesByDriver(user.id, token || undefined);
        const assignedRide = rides.find((r) => r.status === RideStatus.ASSIGNED);
        if (assignedRide && (!incomingRide || incomingRide.id !== assignedRide.id)) {
          setIncomingRide(mapRideResponseToDriverTrip(assignedRide, 0));
        }
      } catch {
        // ignore polling error
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [availabilityStatus, user?.id, token, activeTrip, incomingRide]);

  /**
   * Toggle Online (AVAILABLE) / Offline (OFFLINE)
   * Requires at least one registered vehicle and an active vehicle ticked before going online.
   */
  const toggleOnlineStatus = async () => {
    if (activeTrip) {
      throw new Error('Cannot go offline while you have an active trip in progress.');
    }

    const nextStatus: AvailabilityStatus =
      availabilityStatus === 'OFFLINE' ? 'AVAILABLE' : 'OFFLINE';

    if (nextStatus === 'AVAILABLE') {
      const tickedVehicle = vehicles.find((v) => v.isActive) || driverProfile?.vehicle;
      if (!tickedVehicle || !tickedVehicle.licensePlate) {
        throw new Error(
          'Please add a vehicle from your Driver Profile and tick an active vehicle before going online.'
        );
      }
    }

    setIsLoadingDriver(true);
    try {
      if (driverProfile?.id && !driverProfile.id.startsWith('drv_local_')) {
        try {
          if (nextStatus === 'AVAILABLE' && activeVehicle) {
            await driverService.updateVehicle(driverProfile.id, activeVehicle, token || undefined);
          }
        } catch {
          // ignore vehicle sync warning
        }

        try {
          const updated = await driverService.updateAvailability(
            driverProfile.id,
            { availabilityStatus: nextStatus },
            token || undefined
          );
          const mergedProfile: DriverResponse = {
            ...updated,
            vehicle: activeVehicle || updated.vehicle,
          };
          setDriverProfile(mergedProfile);
          setAvailabilityStatus(updated.availabilityStatus);

          if (nextStatus === 'AVAILABLE') {
            try {
              await driverService.updateLocation(
                driverProfile.id,
                {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  address: currentAddress,
                },
                token || undefined
              );
            } catch {
              // ignore location update warning
            }
          }
        } catch {
          setAvailabilityStatus(nextStatus);
        }
      } else {
        setAvailabilityStatus(nextStatus);
      }

      if (nextStatus === 'OFFLINE') {
        setIncomingRide(null);
      }
    } finally {
      setIsLoadingDriver(false);
    }
  };

  /**
   * Add a new vehicle (or update existing vehicle by plate) and optionally activate it.
   * Only ONE vehicle can be active at a time.
   */
  const addDriverVehicle = async (input: AddVehicleInput): Promise<DriverResponse> => {
    const cleanPlate = input.vehicle.licensePlate.trim().toUpperCase();
    const cleanLicense = (
      input.licenseNumber ||
      driverProfile?.licenseNumber ||
      ''
    )
      .trim()
      .toUpperCase();
    const cleanServiceArea = (
      input.serviceArea ||
      driverProfile?.serviceArea ||
      'Colombo'
    ).trim();

    if (!cleanLicense) {
      throw new Error('Driving license number is required.');
    }

    const newVehId = normalizeVehicleId({ ...input.vehicle, licensePlate: cleanPlate });
    const shouldActivate = vehicles.length === 0 || input.setAsActive !== false;

    const preparedVehicle: DriverVehicle = {
      ...input.vehicle,
      id: newVehId,
      licensePlate: cleanPlate,
      isActive: shouldActivate,
    };

    setIsLoadingDriver(true);
    try {
      // Build updated vehicles list where only one vehicle has isActive = true
      const existingIndex = vehicles.findIndex(
        (v) => v.licensePlate.toUpperCase() === cleanPlate || v.id === newVehId
      );

      let nextVehicles: DriverVehicle[];
      if (existingIndex >= 0) {
        nextVehicles = vehicles.map((v, idx) => {
          if (idx === existingIndex) {
            return {
              ...preparedVehicle,
              isActive: shouldActivate ? true : v.isActive,
            };
          }
          return shouldActivate ? { ...v, isActive: false } : v;
        });
      } else {
        nextVehicles = [
          ...vehicles.map((v) => (shouldActivate ? { ...v, isActive: false } : v)),
          preparedVehicle,
        ];
      }

      // Ensure at least one vehicle is active
      if (!nextVehicles.some((v) => v.isActive) && nextVehicles.length > 0) {
        nextVehicles[0] = { ...nextVehicles[0], isActive: true };
      }

      const activeVeh = nextVehicles.find((v) => v.isActive) || preparedVehicle;

      let updatedProfile: DriverResponse | null = driverProfile;

      // Sync with Driver & Vehicle Service backend
      if (!driverProfile?.id || driverProfile.id.startsWith('drv_local_')) {
        try {
          updatedProfile = await driverService.registerDriver(
            {
              userId: user?.id,
              licenseNumber: cleanLicense,
              serviceArea: cleanServiceArea,
              vehicle: activeVeh,
            },
            token || undefined
          );
        } catch {
          try {
            if (user?.id) {
              const existing = await driverService.getDriverByUserId(user.id, token || undefined);
              updatedProfile = await driverService.updateVehicle(
                existing.id,
                activeVeh,
                token || undefined
              );
            }
          } catch {
            // Fallback to local profile if backend isn't reachable
          }
        }
      } else if (shouldActivate) {
        try {
          updatedProfile = await driverService.updateVehicle(
            driverProfile.id,
            activeVeh,
            token || undefined
          );
        } catch {
          // Keep local update if backend fails
        }
      }

      const finalProfile: DriverResponse = {
        id: updatedProfile?.id || driverProfile?.id || `drv_local_${user?.id || Date.now()}`,
        userId: user?.id || updatedProfile?.userId || 'driver',
        licenseNumber: cleanLicense,
        serviceArea: cleanServiceArea,
        availabilityStatus: updatedProfile?.availabilityStatus || availabilityStatus || 'OFFLINE',
        vehicle: activeVeh,
        rating: updatedProfile?.rating ?? driverProfile?.rating ?? 4.95,
        totalTrips: updatedProfile?.totalTrips ?? driverProfile?.totalTrips ?? 0,
        isApproved: true,
      };

      setVehicles(nextVehicles);
      setDriverProfile(finalProfile);
      await persistVehicles(nextVehicles, finalProfile);

      return finalProfile;
    } finally {
      setIsLoadingDriver(false);
    }
  };

  /**
   * Select / tick a vehicle as the ONLY active vehicle for online trips.
   */
  const selectActiveVehicle = async (vehicleIdOrPlate: string): Promise<void> => {
    if (activeTrip) {
      throw new Error('Cannot switch active vehicle while you have a trip in progress.');
    }

    const target = vehicles.find(
      (v) =>
        v.id === vehicleIdOrPlate ||
        v.licensePlate.toUpperCase() === vehicleIdOrPlate.toUpperCase()
    );
    if (!target) return;

    setIsLoadingDriver(true);
    try {
      const nextVehicles = vehicles.map((v) => ({
        ...v,
        isActive:
          v.id === target.id ||
          v.licensePlate.toUpperCase() === target.licensePlate.toUpperCase(),
      }));

      const activatedVehicle: DriverVehicle = { ...target, isActive: true };

      if (driverProfile?.id && !driverProfile.id.startsWith('drv_local_')) {
        try {
          await driverService.updateVehicle(
            driverProfile.id,
            activatedVehicle,
            token || undefined
          );
        } catch {
          // continue with local state update
        }
      }

      const nextProfile: DriverResponse | null = driverProfile
        ? {
            ...driverProfile,
            vehicle: activatedVehicle,
          }
        : null;

      setVehicles(nextVehicles);
      if (nextProfile) {
        setDriverProfile(nextProfile);
      }
      await persistVehicles(nextVehicles, nextProfile);
    } finally {
      setIsLoadingDriver(false);
    }
  };

  /**
   * Remove a vehicle from the driver's registered vehicles list.
   */
  const removeDriverVehicle = async (vehicleIdOrPlate: string): Promise<void> => {
    if (isOnline) {
      throw new Error('Please go offline before removing a registered vehicle.');
    }

    const remaining = vehicles.filter(
      (v) =>
        v.id !== vehicleIdOrPlate &&
        v.licensePlate.toUpperCase() !== vehicleIdOrPlate.toUpperCase()
    );

    if (remaining.length > 0 && !remaining.some((v) => v.isActive)) {
      remaining[0] = { ...remaining[0], isActive: true };
    }

    const nextActive = remaining.find((v) => v.isActive) || remaining[0];
    const nextProfile: DriverResponse | null = driverProfile
      ? {
          ...driverProfile,
          vehicle: nextActive,
        }
      : null;

    setVehicles(remaining);
    setDriverProfile(nextProfile);
    await persistVehicles(remaining, nextProfile);
  };

  /**
   * Register driver operational profile & vehicle
   * POST /api/v1/drivers
   */
  const registerOrUpdateDriverProfile = async (
    request: RegisterDriverRequest
  ): Promise<DriverResponse> => {
    return addDriverVehicle({
      licenseNumber: request.licenseNumber,
      serviceArea: request.serviceArea,
      vehicle: request.vehicle,
      setAsActive: true,
    });
  };

  /**
   * Update vehicle details
   * PUT /api/v1/drivers/{driverId}/vehicle
   */
  const updateDriverVehicle = async (request: UpdateVehicleRequest): Promise<DriverResponse> => {
    return addDriverVehicle({
      licenseNumber: driverProfile?.licenseNumber || '',
      serviceArea: driverProfile?.serviceArea || 'Colombo',
      vehicle: {
        ...request,
        color: request.color || 'White',
      },
      setAsActive: true,
    });
  };

  /**
   * Sync live GPS coordinates to Driver Service
   * PATCH /api/v1/drivers/{driverId}/location
   */
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

  /**
   * Simulate an incoming ride request for instant demo / testing when online
   */
  const simulateIncomingRide = () => {
    const sampleIdx = Math.floor(Math.random() * SAMPLE_ROUTES.length);
    const route = SAMPLE_ROUTES[sampleIdx];
    const passenger = SAMPLE_PASSENGERS[sampleIdx % SAMPLE_PASSENGERS.length];
    const vType = activeVehicle?.vehicleType || driverProfile?.vehicle?.vehicleType || VehicleType.TUK;

    const simulated: DriverTripRecord = {
      id: `ride_sim_${Date.now()}`,
      createdAt: new Date().toISOString(),
      pickup: route.pickup,
      destination: route.destination,
      vehicleType: vType,
      paymentMethod: PaymentMethod.CASH,
      fare: route.fare,
      netEarning: Math.round(route.fare * (1 - APP_CONFIG.platformCommissionRate)),
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      status: RideStatus.ASSIGNED,
      passenger,
    };

    setIncomingRide(simulated);
  };

  /**
   * Accept incoming ride offer
   * PATCH /api/v1/rides/{id}/accept
   */
  const acceptIncomingRide = async (): Promise<DriverTripRecord | null> => {
    if (!incomingRide) return null;
    setIsLoadingDriver(true);
    try {
      let acceptedTrip: DriverTripRecord = {
        ...incomingRide,
        status: RideStatus.ACCEPTED,
      };

      if (!incomingRide.id.startsWith('ride_sim_')) {
        try {
          const res = await rideService.acceptRide(incomingRide.id, token || undefined);
          acceptedTrip = mapRideResponseToDriverTrip(res);
        } catch {
          // fallback local transition
        }
      }

      setActiveTrip(acceptedTrip);
      setIncomingRide(null);
      return acceptedTrip;
    } finally {
      setIsLoadingDriver(false);
    }
  };

  /**
   * Decline incoming ride offer
   */
  const declineIncomingRide = async () => {
    if (!incomingRide) return;
    if (!incomingRide.id.startsWith('ride_sim_')) {
      try {
        await rideService.cancelRide(
          incomingRide.id,
          { cancellationReason: 'Declined by driver' },
          token || undefined
        );
      } catch {
        // ignore
      }
    }
    setIncomingRide(null);
  };

  /**
   * Start trip once passenger is picked up
   * PATCH /api/v1/rides/{id}/start
   */
  const startActiveTrip = async () => {
    if (!activeTrip) return;
    setIsLoadingDriver(true);
    try {
      if (!activeTrip.id.startsWith('ride_sim_')) {
        try {
          await rideService.startRide(activeTrip.id, token || undefined);
        } catch {
          // fallback local transition
        }
      }

      setActiveTrip({
        ...activeTrip,
        status: RideStatus.IN_PROGRESS,
      });
      setAvailabilityStatus('ON_TRIP');
    } finally {
      setIsLoadingDriver(false);
    }
  };

  /**
   * Complete active trip at drop-off
   * PATCH /api/v1/rides/{id}/complete
   */
  const completeActiveTrip = async () => {
    if (!activeTrip) return;
    setIsLoadingDriver(true);
    try {
      let finalFare = activeTrip.fare;

      if (!activeTrip.id.startsWith('ride_sim_')) {
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
          if (res.finalFare) {
            finalFare = res.finalFare;
          }
        } catch {
          // fallback local completion
        }
      }

      const completedRecord: DriverTripRecord = {
        ...activeTrip,
        fare: finalFare,
        netEarning: Math.round(finalFare * (1 - APP_CONFIG.platformCommissionRate)),
        status: RideStatus.COMPLETED,
        completedAt: new Date().toISOString(),
      };

      setTripHistory((prev) => [completedRecord, ...prev]);
      setActiveTrip(null);
      setAvailabilityStatus('AVAILABLE');
    } finally {
      setIsLoadingDriver(false);
    }
  };

  /**
   * Cancel active trip before completion
   * PATCH /api/v1/rides/{id}/cancel
   */
  const cancelActiveTrip = async (reason: string = 'Cancelled by driver') => {
    if (!activeTrip) return;
    setIsLoadingDriver(true);
    try {
      if (!activeTrip.id.startsWith('ride_sim_')) {
        try {
          await rideService.cancelRide(
            activeTrip.id,
            { cancellationReason: reason },
            token || undefined
          );
        } catch {
          // fallback
        }
      }

      const cancelledRecord: DriverTripRecord = {
        ...activeTrip,
        status: RideStatus.CANCELLED,
      };

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

  // Compute real-time earnings from completed trips
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

    for (const trip of completed) {
      const ts = new Date(trip.completedAt || trip.createdAt).getTime();
      const net = trip.netEarning || Math.round(trip.fare * 0.88);
      totalEarnings += net;
      if (ts >= startOfWeek) {
        weekEarnings += net;
        weekTrips += 1;
      }
      if (ts >= startOfToday) {
        todayEarnings += net;
        todayTrips += 1;
      }
    }

    return {
      todayEarnings,
      weekEarnings,
      totalEarnings,
      todayTrips,
      weekTrips,
      totalCompletedTrips: (driverProfile?.totalTrips || 0) + completed.length,
      onlineHoursToday: isOnline ? 4.5 : 3.2,
      walletBalance: (user?.walletBalance || 12450) + todayEarnings,
    };
  }, [tripHistory, driverProfile?.totalTrips, isOnline, user?.walletBalance]);

  return (
    <DriverContext.Provider
      value={{
        driverProfile,
        vehicles,
        activeVehicle,
        availabilityStatus,
        isOnline,
        isLoadingDriver,
        incomingRide,
        activeTrip,
        tripHistory,
        earnings,
        toggleOnlineStatus,
        addDriverVehicle,
        selectActiveVehicle,
        removeDriverVehicle,
        registerOrUpdateDriverProfile,
        updateDriverVehicle,
        syncDriverLocation,
        refreshDriverData,
        simulateIncomingRide,
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

