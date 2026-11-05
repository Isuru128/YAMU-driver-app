export enum VehicleType {
  TUK = 'TUK',
  BIKE = 'BIKE',
  CAR = 'CAR',
  VAN = 'VAN',
}

export enum RideStatus {
  IDLE = 'IDLE',
  REQUESTED = 'REQUESTED',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  WALLET = 'WALLET',
}

export const VEHICLE_OPTIONS = [
  {
    id: VehicleType.TUK,
    name: 'Tuk Tuk',
    capacity: 3,
    description: 'Three-wheeler city rides',
    iconName: 'car-sport',
    baseFare: 120,
    perKmRate: 60,
  },
  {
    id: VehicleType.BIKE,
    name: 'Motorbike',
    capacity: 1,
    description: ' Solo passenger express rides',
    iconName: 'bicycle',
    baseFare: 80,
    perKmRate: 40,
  },
  {
    id: VehicleType.CAR,
    name: 'Car / Sedan',
    capacity: 4,
    description: 'Air-conditioned private car',
    iconName: 'car',
    baseFare: 200,
    perKmRate: 100,
  },
  {
    id: VehicleType.VAN,
    name: 'Passenger Van',
    capacity: 8,
    description: 'Group & airport transfers',
    iconName: 'bus',
    baseFare: 350,
    perKmRate: 140,
  },
];

