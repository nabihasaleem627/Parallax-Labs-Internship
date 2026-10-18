import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityLog, memberships, projects, users } from "@/db/schema";
import { getTenantSettings } from "@/lib/tenant-settings";
import type { TenantSettingsResult } from "@/lib/tenant-settings-types";
import { checkRedisHealth } from "@/lib/redis";

export interface ActivityItem {
  id: number;
  action: string;
  metadata: unknown;
  createdAt: string;
  actorName: string | null;
}

export interface WorkspaceOverview {
  tenant: { id: number; name: string; slug: string };
  memberCount: number;
  projectCounts: { active: number; onHold: number; completed: number; archived: number; total: number };
  recentActivity: ActivityItem[];
  settings: TenantSettingsResult;
  redisAvailable: boolean;
}

export async function getWorkspaceOverview(tenantId: number, tenantName: string, tenantSlug: string): Promise<WorkspaceOverview> {
  const [memberCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memberships)
    .where(eq(memberships.tenantId, tenantId));

  const projectRows = await db
    .select({ status: projects.status, count: sql<number>`count(*)::int` })
    .from(projects)
    .where(eq(projects.tenantId, tenantId))
    .groupBy(projects.status);

  const projectCounts = { active: 0, onHold: 0, completed: 0, archived: 0, total: 0 };
  for (const row of projectRows) {
    projectCounts.total += row.count;
    if (row.status === "active") projectCounts.active = row.count;
    else if (row.status === "on_hold") projectCounts.onHold = row.count;
    else if (row.status === "completed") projectCounts.completed = row.count;
    else if (row.status === "archived") projectCounts.archived = row.count;
  }

  const recentRows = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
      actorName: users.name,
    })
    .from(activityLog)
    .leftJoin(users, eq(activityLog.userId, users.id))
    .where(eq(activityLog.tenantId, tenantId))
    .orderBy(desc(activityLog.createdAt))
    .limit(8);

  const settings = await getTenantSettings(tenantId);
  const redisHealth = await checkRedisHealth();

  return {
    tenant: { id: tenantId, name: tenantName, slug: tenantSlug },
    memberCount: memberCountRow?.count ?? 0,
    projectCounts,
    recentActivity: recentRows.map((row) => ({
      id: row.id,
      action: row.action,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
      actorName: row.actorName,
    })),
    settings,
    redisAvailable: redisHealth.status === "available",
  };
}
