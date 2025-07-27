import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export class ApiError extends Error {
  status: number;
  response?: ApiResponse;

  constructor(message: string, status: number, response?: ApiResponse) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Get authentication token from AsyncStorage
  private async getAuthToken(): Promise<string | null> {
    try {
      const session = await AsyncStorage.getItem('wellnoosh_session');
      if (session) {
        const parsedSession = JSON.parse(session);
        return parsedSession.access_token || null;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }

  // Create request headers
  private async createHeaders(includeAuth: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.createHeaders(includeAuth);

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      const responseData: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new ApiError(
          responseData.error || `HTTP ${response.status}`,
          response.status,
          responseData
        );
      }

      if (!responseData.success) {
        throw new ApiError(
          responseData.error || 'API request failed',
          response.status,
          responseData
        );
      }

      console.log(`✅ API Success: ${config.method || 'GET'} ${url}`);
      return responseData.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`❌ API Error: ${config.method || 'GET'} ${url}`, error.message);
        throw error;
      }

      console.error(`❌ Network Error: ${config.method || 'GET'} ${url}`, error);
      throw new ApiError('Network request failed', 0);
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  async post<T>(endpoint: string, data?: any, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async put<T>(endpoint: string, data?: any, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string; version: string }> {
    return this.get('/health', false);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;