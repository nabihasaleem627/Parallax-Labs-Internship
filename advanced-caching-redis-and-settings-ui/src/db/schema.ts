import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member"]);
export const projectStatusEnum = pgEnum("project_status", ["active", "on_hold", "completed", "archived"]);
export const themeEnum = pgEnum("theme_preference", ["light", "dark", "system"]);
export const densityEnum = pgEnum("dashboard_density", ["comfortable", "compact"]);

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("tenants_slug_idx").on(table.slug),
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userTenantIdx: uniqueIndex("memberships_user_tenant_idx").on(table.userId, table.tenantId),
}));

export const sessions = pgTable("sessions", {
  token: varchar("token", { length: 128 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").default("").notNull(),
  status: projectStatusEnum("status").notNull().default("active"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tenantSettings = pgTable("tenant_settings", {
  tenantId: integer("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
  workspaceName: varchar("workspace_name", { length: 120 }).notNull(),
  workspaceDescription: text("workspace_description").default("").notNull(),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  locale: varchar("locale", { length: 16 }).notNull().default("en-US"),
  theme: themeEnum("theme").notNull().default("system"),
  density: densityEnum("density").notNull().default("comfortable"),
  notifyEmailUpdates: boolean("notify_email_updates").notNull().default(true),
  notifyProjectActivity: boolean("notify_project_activity").notNull().default(true),
  notifyWeeklyDigest: boolean("notify_weekly_digest").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id, { onDelete: "set null" }),
});

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 160 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
