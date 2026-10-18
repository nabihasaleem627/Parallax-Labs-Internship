import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLog, projects } from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";
import { projectCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth) {
    return apiError("Not authenticated", 401);
  }

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.tenantId, auth.tenant.id))
    .orderBy(desc(projects.updatedAt));

  return apiOk({ projects: rows });
}

export async function POST(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) {
    return apiError("Not authenticated", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON", 400);
  }

  const parsed = projectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
  }

  const [created] = await db
    .insert(projects)
    .values({
      tenantId: auth.tenant.id,
      name: parsed.data.name,
      description: parsed.data.description,
      status: parsed.data.status,
      createdBy: auth.user.id,
    })
    .returning();

  await db.insert(activityLog).values({
    tenantId: auth.tenant.id,
    userId: auth.user.id,
    action: "project_created",
    metadata: { projectId: created.id, name: created.name },
  });

  return apiOk({ project: created }, 201);
}

// Guard: deletions always re-check tenant ownership so one tenant can never
// mutate or remove another tenant's project by guessing an id.
export async function DELETE(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) {
    return apiError("Not authenticated", 401);
  }

  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  const id = idParam ? Number(idParam) : NaN;
  if (!Number.isInteger(id)) {
    return apiError("A valid project id is required", 400);
  }

  const deleted = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.tenantId, auth.tenant.id)))
    .returning({ id: projects.id });

  if (deleted.length === 0) {
    return apiError("Project not found", 404);
  }

  return apiOk({ deletedId: id });
}
