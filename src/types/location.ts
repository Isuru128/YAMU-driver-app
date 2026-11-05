export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPoint {
  id?: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

