import { ENV } from '../config/env';

interface RequestOptions extends RequestInit {
  token?: string | null;
}

// Shared authentication token across all microservice clients
let sharedAuthToken: string | null = null;

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = ENV.API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    sharedAuthToken = token;
  }

  getToken(): string | null {
    return sharedAuthToken;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token = sharedAuthToken, headers, ...rest } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
      ...(headers as Record<string, string>),
    };

    const targetUrl = `${this.baseUrl}${endpoint}`;

    const response = await fetch(targetUrl, {
      ...rest,
      headers: requestHeaders,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        errorData.error ||
        (Array.isArray(errorData.errors) ? errorData.errors.join(', ') : null) ||
        `Request to ${this.baseUrl} failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return (await response.text()) as unknown as T;
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Microservice-specific API clients (Driver App)
export const accountApiClient = new ApiClient(ENV.ACCOUNT_SERVICE_URL);
export const driverApiClient = new ApiClient(ENV.DRIVER_SERVICE_URL);
export const rideApiClient = new ApiClient(ENV.RIDE_SERVICE_URL);
export const paymentApiClient = new ApiClient(ENV.PAYMENT_SERVICE_URL);

// Default client for account operations
export const apiClient = accountApiClient;

