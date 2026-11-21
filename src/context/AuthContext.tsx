import React, { createContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types/user';
import {
  AccountResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from '../types/account';
import { storageService } from '../services/storageService';
import { accountService } from '../services/accountService';
import { apiClient } from '../api/client';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: UserProfile | null;
  login: (request: LoginRequest) => Promise<AuthResponse>;
  register: (request: RegisterRequest) => Promise<AuthResponse>;
  refreshProfile: () => Promise<AccountResponse | null>;
  updateProfile: (request: UpdateProfileRequest) => Promise<AccountResponse>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<UserProfile>) => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const mapAccountToUserProfile = (
  acc: AccountResponse,
  existing?: UserProfile | null
): UserProfile => ({
  id: acc.id,
  fullName: `${acc.firstName || ''} ${acc.lastName || ''}`.trim() || 'Driver Partner',
  firstName: acc.firstName,
  lastName: acc.lastName,
  phoneNumber: acc.phoneNumber,
  email: acc.email,
  avatarUrl: acc.profile?.profilePictureUrl || existing?.avatarUrl,
  role: acc.role,
  status: acc.status,
  profile: acc.profile,
  rating: existing?.rating ?? 5.0,
  walletBalance: existing?.walletBalance ?? 0,
  createdAt: acc.createdAt,
  updatedAt: acc.updatedAt,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await storageService.getItem('driverAuthToken');
        const savedAccountId = await storageService.getItem('driverAccountId');

        if (savedToken && savedAccountId) {
          setToken(savedToken);
          apiClient.setToken(savedToken);

          const cachedAvatar = await storageService.getItem(`driverAvatar_${savedAccountId}`);
          const freshAccount = await accountService.getAccountById(savedAccountId, savedToken);
          if (freshAccount.role && freshAccount.role === 'PASSENGER') {
            await storageService.removeItem('driverAuthToken');
            await storageService.removeItem('driverAccountId');
            setToken(null);
            apiClient.setToken(null);
            setIsAuthenticated(false);
            setUser(null);
            return;
          }
          setUser((prev) => {
            const mapped = mapAccountToUserProfile(freshAccount, prev);
            if (!mapped.avatarUrl && cachedAvatar) {
              mapped.avatarUrl = cachedAvatar;
            }
            return mapped;
          });
          setIsAuthenticated(true);
        }
      } catch {
        await storageService.removeItem('driverAuthToken');
        await storageService.removeItem('driverAccountId');
        setToken(null);
        apiClient.setToken(null);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (request: LoginRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await accountService.login(request);

      if (response.account?.role && response.account.role === 'PASSENGER') {
        throw new Error(
          'This app is for YAMU Driver Partners only. Passenger accounts should use the YAMU Passenger app.'
        );
      }

      setToken(response.token);
      apiClient.setToken(response.token);

      const cachedAvatar = response.account?.id
        ? await storageService.getItem(`driverAvatar_${response.account.id}`)
        : null;
      const mappedUser = mapAccountToUserProfile(response.account, user);
      if (!mappedUser.avatarUrl && cachedAvatar) {
        mappedUser.avatarUrl = cachedAvatar;
      }

      setUser(mappedUser);
      setIsAuthenticated(true);

      await storageService.setItem('driverAuthToken', response.token);
      if (response.account?.id) {
        await storageService.setItem('driverAccountId', response.account.id);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (request: RegisterRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await accountService.register({
        ...request,
        role: 'DRIVER',
      });
      setToken(response.token);
      apiClient.setToken(response.token);

      const mappedUser = mapAccountToUserProfile(response.account, user);
      setUser(mappedUser);
      setIsAuthenticated(true);

      await storageService.setItem('driverAuthToken', response.token);
      if (response.account?.id) {
        await storageService.setItem('driverAccountId', response.account.id);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = useCallback(async (): Promise<AccountResponse | null> => {
    const currentId = user?.id;
    if (!currentId) return null;

    setIsLoading(true);
    try {
      const accountData = await accountService.getAccountById(currentId, token || undefined);
      setUser((prev) => mapAccountToUserProfile(accountData, prev));
      return accountData;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, token]);

  const updateProfile = async (request: UpdateProfileRequest): Promise<AccountResponse> => {
    const currentId = user?.id;
    if (!currentId) throw new Error('No logged-in driver to update');

    setIsLoading(true);
    try {
      if (request.profile?.profilePictureUrl) {
        await storageService.setItem(`driverAvatar_${currentId}`, request.profile.profilePictureUrl);
      }

      const updatedAccount = await accountService.updateProfile(
        currentId,
        request,
        token || undefined
      );
      setUser((prev) => {
        const mapped = mapAccountToUserProfile(updatedAccount, prev);
        if (request.profile?.profilePictureUrl) {
          mapped.avatarUrl = request.profile.profilePictureUrl;
        }
        return mapped;
      });
      return updatedAccount;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    apiClient.setToken(null);
    setToken(null);
    await storageService.removeItem('driverAuthToken');
    await storageService.removeItem('driverAccountId');
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        user,
        login,
        register,
        refreshProfile,
        updateProfile,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
