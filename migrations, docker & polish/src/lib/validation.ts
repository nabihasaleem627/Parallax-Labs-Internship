import { z } from "zod";

// Node 18+ exposes the IANA tz database via Intl; use it to validate
// timezone input instead of trusting an open free-text string.
const VALID_TIMEZONES = new Set(
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"],
);

export const settingsUpdateSchema = z
  .object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    timezone: z
      .string()
      .min(1)
      .max(64)
      .refine((value) => VALID_TIMEZONES.has(value), {
        message: "Must be a valid IANA timezone identifier (e.g. 'America/New_York').",
      })
      .optional(),
    language: z
      .string()
      .regex(/^[a-z]{2}(-[A-Z]{2})?$/, "Must be a language code like 'en' or 'en-US'.")
      .optional(),
    notificationPreferences: z
      .object({
        email: z.boolean(),
        sms: z.boolean(),
        push: z.boolean(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one setting field must be provided.",
  });

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

export const tenantAuthSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Tenant slug is required.")
    .max(64)
    .regex(/^[a-z0-9-]+$/i, "Tenant slug may only contain letters, numbers, and hyphens."),
  apiKey: z.string().trim().min(1, "API key is required."),
});
