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

const STORAGE_KEYS = {
  TOKEN: 'yamu_driver_auth_token',
  ACCOUNT_ID: 'yamu_driver_account_id',
  USER_PROFILE: 'yamu_driver_user_profile',
};

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

  const persistSession = async (jwtToken: string, userProfile: UserProfile) => {
    await Promise.all([
      storageService.setItem(STORAGE_KEYS.TOKEN, jwtToken),
      storageService.setItem(STORAGE_KEYS.ACCOUNT_ID, userProfile.id),
      storageService.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile)),
    ]);
  };

  const clearPersistedSession = async () => {
    await Promise.all([
      storageService.removeItem(STORAGE_KEYS.TOKEN),
      storageService.removeItem(STORAGE_KEYS.ACCOUNT_ID),
      storageService.removeItem(STORAGE_KEYS.USER_PROFILE),
    ]);
  };

  // Automatically restore driver session on app startup without forcing re-login
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [savedToken, savedAccountId, savedProfileJson] = await Promise.all([
          storageService.getItem(STORAGE_KEYS.TOKEN),
          storageService.getItem(STORAGE_KEYS.ACCOUNT_ID),
          storageService.getItem(STORAGE_KEYS.USER_PROFILE),
        ]);

        if (savedToken && (savedAccountId || savedProfileJson)) {
          let cachedUser: UserProfile | null = null;
          if (savedProfileJson) {
            try {
              cachedUser = JSON.parse(savedProfileJson);
            } catch {
              // ignore JSON parse error
            }
          }

          // Immediately sign the driver in using persisted device credentials
          setToken(savedToken);
          apiClient.setToken(savedToken);
          if (cachedUser) {
            setUser(cachedUser);
          }
          setIsAuthenticated(true);
          setIsLoading(false);

          // Silently sync latest profile in the background
          const targetId = savedAccountId || cachedUser?.id;
          if (targetId) {
            try {
              const cachedAvatar = await storageService.getItem(`driverAvatar_${targetId}`);
              const freshAccount = await accountService.getAccountById(targetId, savedToken);

              if (
                (freshAccount.role && freshAccount.role === 'PASSENGER') ||
                freshAccount.status === 'SUSPENDED' ||
                freshAccount.status === 'DEACTIVATED'
              ) {
                await clearPersistedSession();
                setToken(null);
                apiClient.setToken(null);
                setIsAuthenticated(false);
                setUser(null);
                return;
              }

              const syncedUser = mapAccountToUserProfile(freshAccount, cachedUser);
              if (!syncedUser.avatarUrl && cachedAvatar) {
                syncedUser.avatarUrl = cachedAvatar;
              }
              setUser(syncedUser);
              await storageService.setItem(
                STORAGE_KEYS.USER_PROFILE,
                JSON.stringify(syncedUser)
              );
            } catch {
              // Keep persisted session active even if backend is cold-starting or offline
            }
          }
          return;
        }
      } catch {
        // ignore storage read error
      }
      setIsLoading(false);
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
      await persistSession(response.token, mappedUser);

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
      await persistSession(response.token, mappedUser);

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
      const updatedUser = mapAccountToUserProfile(accountData, user);
      setUser(updatedUser);
      await storageService.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedUser));
      return accountData;
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

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
      const mapped = mapAccountToUserProfile(updatedAccount, user);
      if (request.profile?.profilePictureUrl) {
        mapped.avatarUrl = request.profile.profilePictureUrl;
      }
      setUser(mapped);
      await storageService.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mapped));
      return updatedAccount;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    apiClient.setToken(null);
    setToken(null);
    await clearPersistedSession();
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    if (user) {
      const nextUser = { ...user, ...updated };
      setUser(nextUser);
      storageService.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(nextUser));
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
