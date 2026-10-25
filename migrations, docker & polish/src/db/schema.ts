import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Tenants table.
 *
 * Each tenant represents an isolated customer workspace. Authorization to
 * read/write a tenant's settings is enforced using the `apiKey` column -
 * every request to the settings API must present the matching key for the
 * tenant referenced in the URL. This keeps tenant data isolated even though
 * the demo does not implement a full user/session auth system.
 */
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  apiKey: varchar("api_key", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tenant settings table (1:1 with tenants).
 *
 * Migration history (expand -> backfill -> contract):
 *  - 0000_init: created this table with the legacy `email_notifications`
 *    boolean column only.
 *  - 0001_expand_notification_preferences: added the new, nullable
 *    `notification_preferences` jsonb column alongside the legacy column
 *    (expand phase). Both old and new application code can run at the same
 *    time against this shape.
 *  - scripts/backfill-notification-preferences.ts: batches an UPDATE to
 *    populate `notification_preferences` for all existing rows without
 *    holding a single long-running transaction/lock.
 *  - 0002_contract_notification_preferences: once the backfill is verified
 *    complete, this migration sets NOT NULL + DEFAULT on the new column.
 *  - A future, intentionally NOT-YET-APPLIED migration
 *    (`0003_drop_legacy_email_notifications.sql`, documented in
 *    `drizzle/MIGRATIONS.md`) would drop the legacy `email_notifications`
 *    column once every deployed application version reads/writes only the
 *    new jsonb column. We keep it until then to stay backward compatible.
 */
export const tenantSettings = pgTable(
  "tenant_settings",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" })
      .unique(),
    theme: varchar("theme", { length: 20 }).notNull().default("system"),
    timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
    language: varchar("language", { length: 10 }).notNull().default("en"),
    // Legacy column retained during the expand/contract migration window.
    emailNotifications: boolean("email_notifications").notNull().default(true),
    // New column introduced by the expand migration. Nullable at first,
    // backfilled by scripts/backfill-notification-preferences.ts, then
    // locked down to NOT NULL + DEFAULT by the contract migration.
    notificationPreferences: jsonb("notification_preferences")
      .$type<{ email: boolean; sms: boolean; push: boolean }>()
      .notNull()
      .default({ email: true, sms: false, push: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("tenant_settings_tenant_id_idx").on(table.tenantId)],
);

export type Tenant = typeof tenants.$inferSelect;
export type TenantSettingsRow = typeof tenantSettings.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type NewTenantSettingsRow = typeof tenantSettings.$inferInsert;

// Re-export so other modules can reference a plain object namespace if desired.
export const schema = { tenants, tenantSettings };
export type Schema = typeof schema;
