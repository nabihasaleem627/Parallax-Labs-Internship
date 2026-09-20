import type { FieldErrors } from "@/lib/api";

/**
 * Flattens per-field server errors (arrays) into the first message per field,
 * the shape the client forms display.
 */
export function flattenFieldErrors(fieldErrors: FieldErrors | undefined): Record<string, string> {
  if (!fieldErrors) return {};
  const flat: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages.length > 0) flat[key] = messages[0];
  }
  return flat;
}
