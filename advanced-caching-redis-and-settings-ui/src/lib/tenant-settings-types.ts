export type ThemePreference = "light" | "dark" | "system";
export type DashboardDensity = "comfortable" | "compact";

export interface TenantSettingsDTO {
  tenantId: number;
  workspaceName: string;
  workspaceDescription: string;
  timezone: string;
  locale: string;
  theme: ThemePreference;
  density: DashboardDensity;
  notifyEmailUpdates: boolean;
  notifyProjectActivity: boolean;
  notifyWeeklyDigest: boolean;
  updatedAt: string;
  updatedBy: number | null;
}

export type SettingsSource = "cache" | "database";

export interface TenantSettingsResult {
  settings: TenantSettingsDTO;
  source: SettingsSource;
}
