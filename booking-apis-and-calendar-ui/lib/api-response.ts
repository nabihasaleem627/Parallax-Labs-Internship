import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BOOKING_CONFLICT"
  | "DUPLICATE_REQUEST"
  | "INTERNAL_ERROR";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetail[];
  };
}

/**
 * Returns a standardized JSON success response
 */
export function apiSuccess<T>(
  data: T,
  status: number = 200,
  meta?: ApiSuccessResponse<T>["meta"],
  headers?: Record<string, string>
) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };

  return NextResponse.json(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Returns a standardized JSON error response
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number = 400,
  details: ApiErrorDetail[] = [],
  headers?: Record<string, string>
) {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details.length > 0 ? { details } : {}),
    },
  };

  return NextResponse.json(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}
