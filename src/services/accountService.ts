import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  AccountResponse,
  UpdateProfileRequest,
} from '../types/account';
import { isValidEmail, normalizePhoneNumber } from '../utils/validators';
import { storageService } from './storageService';

/**
 * AccountService connects to the Spring Boot Account Service endpoints (/accounts/**).
 */
export class AccountService {
  /**
   * Register a new driver account
   * POST /accounts/register
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    const cleanEmail = request.email.trim().toLowerCase();
    const cleanPhone = request.phoneNumber.trim();

    const payload = {
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
      email: cleanEmail,
      password: request.password,
      phoneNumber: cleanPhone,
      role: request.role || 'DRIVER',
    };

    const response = await apiClient.post<AuthResponse>(ENDPOINTS.ACCOUNTS.REGISTER, payload);
    if (response?.token) {
      apiClient.setToken(response.token);
    }

    // Cache phone -> email lookup to support phone sign-in even if remote backend expects email field
    const normalizedPhone = normalizePhoneNumber(cleanPhone);
    await storageService.setItem(`phoneEmail_${normalizedPhone}`, cleanEmail);
    await storageService.setItem(`phoneEmail_${cleanPhone.replace(/\s+/g, '')}`, cleanEmail);

    return response;
  }

  /**
   * Authenticate driver using either Email or Phone Number in a single field
   * POST /accounts/login
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    const rawIdentifier = (
      request.identifier ||
      request.email ||
      request.phoneNumber ||
      ''
    ).trim();

    let resolvedIdentifier = rawIdentifier.toLowerCase();

    if (!isValidEmail(rawIdentifier)) {
      const compactPhone = rawIdentifier.replace(/\s+/g, '').replace(/-/g, '');
      const normalizedPhone = normalizePhoneNumber(rawIdentifier);
      const cachedEmail =
        (await storageService.getItem(`phoneEmail_${normalizedPhone}`)) ||
        (await storageService.getItem(`phoneEmail_${compactPhone}`));

      resolvedIdentifier = cachedEmail || compactPhone;
    }

    const payload = {
      email: resolvedIdentifier,
      phoneNumber: !isValidEmail(rawIdentifier) ? rawIdentifier.replace(/\s+/g, '') : undefined,
      password: request.password,
    };

    const response = await apiClient.post<AuthResponse>(ENDPOINTS.ACCOUNTS.LOGIN, payload);
    if (response?.token) {
      apiClient.setToken(response.token);
    }

    if (response?.account?.phoneNumber && response?.account?.email) {
      const norm = normalizePhoneNumber(response.account.phoneNumber);
      await storageService.setItem(`phoneEmail_${norm}`, response.account.email);
      await storageService.setItem(
        `phoneEmail_${response.account.phoneNumber.replace(/\s+/g, '')}`,
        response.account.email
      );
    }

    return response;
  }

  /**
   * Fetch account details by account ID
   * GET /accounts/{id}
   */
  async getAccountById(id: string, token?: string): Promise<AccountResponse> {
    return apiClient.get<AccountResponse>(ENDPOINTS.ACCOUNTS.GET_BY_ID(id), {
      token,
    });
  }

  /**
   * Update user profile details
   * PUT /accounts/{id}
   */
  async updateProfile(
    id: string,
    request: UpdateProfileRequest,
    token?: string
  ): Promise<AccountResponse> {
    return apiClient.put<AccountResponse>(ENDPOINTS.ACCOUNTS.UPDATE_PROFILE(id), request, {
      token,
    });
  }
}

export const accountService = new AccountService();
