// Enhanced API client with better error handling and types
export interface APIResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

export interface APIError {
  error: string;
  message?: string;
  code: number;
}

export class APIClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIClientError';
  }
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData: APIError;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: 'Network error',
            message: `HTTP ${response.status}: ${response.statusText}`,
            code: response.status,
          };
        }
        
        throw new APIClientError(
          errorData.message || errorData.error,
          response.status,
          errorData.error
        );
      }

      // Handle empty responses (like DELETE requests)
      const contentType = response.headers.get('Content-Type');
      if (!contentType?.includes('application/json')) {
        return {} as T;
      }

      const data: APIResponse<T> = await response.json();
      return data.data as T;
    } catch (error) {
      if (error instanceof APIClientError) {
        throw error;
      }
      
      console.error(`API Error [${endpoint}]:`, error);
      throw new APIClientError(
        error instanceof Error ? error.message : 'Unknown error',
        0
      );
    }
  }

  // Generic GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // Generic POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Generic PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Generic DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Health check with timeout
  async getHealth(): Promise<{ status: string; timestamp: string; service: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch('/health', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export default apiClient;
