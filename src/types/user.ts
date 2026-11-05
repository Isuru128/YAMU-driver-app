import type { Role, AccountStatus, ProfileDto } from './account';

export interface UserProfile {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  role?: Role;
  status?: AccountStatus;
  profile?: ProfileDto | null;
  rating?: number;
  walletBalance?: number;
  createdAt?: string;
  updatedAt?: string;
}

