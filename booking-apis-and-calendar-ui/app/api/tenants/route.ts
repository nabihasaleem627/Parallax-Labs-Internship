import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/tenants
 * Lists available tenant workspaces and reports current active tenant.
 */
export async function GET(req: NextRequest) {
  try {
    const currentCtx = await resolveTenant(req);
    const tenants = await prisma.tenant.findMany({
      include: {
        services: true,
        _count: {
          select: {
            bookings: true,
            customers: true,
            users: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return apiSuccess({
      currentTenant: currentCtx?.tenant || tenants[0] || null,
      availableTenants: tenants,
    });
  } catch (error) {
    console.error("GET /api/tenants error:", error);
    return apiError("INTERNAL_ERROR", "Failed to retrieve tenants", 500);
  }
}
