import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  workspaceName: z.string().trim().min(2, "Workspace name must be at least 2 characters").max(120),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const TIMEZONES = new Set(Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : []);
// "UTC" is a valid IANA time zone but is not always included in the
// Intl.supportedValuesOf("timeZone") list depending on the ICU data bundled
// with the runtime, so it is allow-listed explicitly.
TIMEZONES.add("UTC");

export const tenantSettingsSchema = z.object({
  workspaceName: z.string().trim().min(2, "Workspace name must be at least 2 characters").max(120),
  workspaceDescription: z.string().trim().max(500, "Description must be 500 characters or fewer").default(""),
  timezone: z
    .string()
    .trim()
    .min(1, "Time zone is required")
    .refine((tz) => TIMEZONES.size === 0 || TIMEZONES.has(tz), "Unknown time zone"),
  locale: z.enum(["en-US", "en-GB", "fr-FR", "de-DE", "es-ES", "pt-BR", "ja-JP", "zh-CN"], {
    message: "Unsupported locale",
  }),
  theme: z.enum(["light", "dark", "system"]),
  density: z.enum(["comfortable", "compact"]),
  notifyEmailUpdates: z.boolean(),
  notifyProjectActivity: z.boolean(),
  notifyWeeklyDigest: z.boolean(),
});

export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>;

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters").max(160),
  description: z.string().trim().max(500).default(""),
  status: z.enum(["active", "on_hold", "completed", "archived"]).default("active"),
});
