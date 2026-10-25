// Shared types safe to import from both client and server code (no
// database/redis imports here, so this file never pulls server-only
// dependencies into the client bundle).

export type ThemePreference = "light" | "dark" | "system";

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface TenantSettingsDTO {
  tenantId: number;
  slug: string;
  name: string;
  theme: ThemePreference;
  timezone: string;
  language: string;
  notificationPreferences: NotificationPreferences;
}

export type CacheSource = "cache" | "database";

export interface SettingsApiResponse {
  tenant: { slug: string; name: string };
  settings: TenantSettingsDTO;
  cache: { source: CacheSource };
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}
