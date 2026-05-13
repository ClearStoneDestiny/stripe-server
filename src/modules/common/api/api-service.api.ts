import { HttpMethodsEnum } from '@common/enums/http-method.enum';

interface IApiServiceConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  maxRetries?: number;
  retryDelayMs?: number;
}

interface IRequestOptions {
  endpoint: string;
  method?: HttpMethodsEnum;
  queryParams?: Record<string, string | number>;
  body?: any;
  headers?: Record<string, string>;
}

const RETRY_HTTP_STATUSES = {
  TOO_MANY_REQUESTS: 429,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

export class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(config: IApiServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultHeaders = config.headers || {};
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
  }

  private async waitForDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async sendRequestWithRetry<T>(
    options: IRequestOptions,
    attempt = 1,
  ): Promise<Response> {
    const url = new URL(`${this.baseUrl}${options.endpoint}`);

    if (options.queryParams) {
      Object.entries(options.queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }

    try {
      const response = await fetch(url.toString(), {
        method: options.method || HttpMethodsEnum.GET,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        credentials: 'include',
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        const errorMessage = await this.extractErrorMessage(response);

        if (this.shouldRetry(response.status) && attempt <= this.maxRetries) {
          await this.waitForDelay(this.retryDelayMs);
          return this.sendRequestWithRetry<T>(options, attempt + 1);
        }

        throw new Error(errorMessage);
      }

      return response;
    } catch (error: any) {
      if (this.isNetworkError(error) && attempt <= this.maxRetries) {
        await this.waitForDelay(this.retryDelayMs);
        return this.sendRequestWithRetry<T>(options, attempt + 1);
      }

      throw error;
    }
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    try {
      const errorData = await response.json();
      return errorData?.error || errorData?.message || response.statusText;
    } catch {
      return response.statusText;
    }
  }

  private shouldRetry(status: number): boolean {
    return (
      status !== undefined &&
      Object.values(RETRY_HTTP_STATUSES).includes(status)
    );
  }

  private isNetworkError(error: any): boolean {
    return error instanceof TypeError && error.message.includes('fetch');
  }

  public async sendRequest<T>(options: IRequestOptions): Promise<Response> {
    return this.sendRequestWithRetry<T>(options);
  }
}
