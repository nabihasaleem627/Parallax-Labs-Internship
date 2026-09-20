import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type FieldErrors = Record<string, string[]>;

export function apiError(
  status: number,
  error: string,
  fieldErrors?: FieldErrors
): NextResponse {
  return NextResponse.json({ ok: false, error, fieldErrors }, { status });
}

/** Converts a ZodError into the API error shape with per-field messages. */
export function zodValidationError(error: ZodError): NextResponse {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_general";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return apiError(400, error.issues[0]?.message ?? "Invalid input", fieldErrors);
}
