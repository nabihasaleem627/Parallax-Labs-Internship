import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";
import { ProjectBoard, type ProjectItem } from "@/components/project-board";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const auth = await getCurrentAuth();
  if (!auth) return null;

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.tenantId, auth.tenant.id))
    .orderBy(desc(projects.updatedAt));

  const items: ProjectItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Projects</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Projects are scoped to {auth.tenant.name} and isolated from other tenants.
        </p>
      </div>
      <ProjectBoard initialProjects={items} />
    </div>
  );
}
