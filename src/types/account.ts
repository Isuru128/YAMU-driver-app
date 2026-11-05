export type Role = 'DRIVER' | 'PASSENGER' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface ProfileDto {
  dateOfBirth?: string;
  gender?: string;
  profilePictureUrl?: string;
  address?: string;
  emergencyContact?: string;
}

export interface AccountResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: Role;
  status: AccountStatus;
  profile?: ProfileDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role?: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType?: string;
  expiresIn?: number;
  account: AccountResponse;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profile?: ProfileDto;
}

