export interface ApiResponse<T> {
    status: number;
    error: boolean;
    message: string;
    data: T | null;
  }

  export function createResponse<T>(status: number, message: string, data: T | null = null): ApiResponse<T> {
    return {
      status,
      error: status >= 400,
      message,
      data,
    };
  }
