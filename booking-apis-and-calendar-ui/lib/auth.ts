import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Tenant } from "@prisma/client";

export interface TenantContext {
  tenant: Tenant;
  tenantId: string;
}

/**
 * Resolves the current tenant based on request headers, cookies, query parameters,
 * or falls back to the default seeded tenant for a seamless developer & demo experience.
 */
export async function resolveTenant(req?: NextRequest): Promise<TenantContext | null> {
  let tenant: Tenant | null = null;

  if (req) {
    // 1. Check custom headers (common for API clients, Postman, webhooks)
    const headerTenantId = req.headers.get("x-tenant-id");
    const headerTenantSlug = req.headers.get("x-tenant-slug");

    if (headerTenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: headerTenantId } });
    } else if (headerTenantSlug) {
      tenant = await prisma.tenant.findUnique({ where: { slug: headerTenantSlug } });
    }

    // 2. Check query params (e.g. /api/bookings?tenantId=... or ?tenantSlug=...)
    if (!tenant) {
      const { searchParams } = new URL(req.url);
      const queryTenantId = searchParams.get("tenantId");
      const queryTenantSlug = searchParams.get("tenantSlug");

      if (queryTenantId) {
        tenant = await prisma.tenant.findUnique({ where: { id: queryTenantId } });
      } else if (queryTenantSlug) {
        tenant = await prisma.tenant.findUnique({ where: { slug: queryTenantSlug } });
      }
    }

    // 3. Check cookies (used by the web UI tenant switcher)
    if (!tenant) {
      const cookieTenantSlug = req.cookies.get("saas_tenant_slug")?.value;
      const cookieTenantId = req.cookies.get("saas_tenant_id")?.value;

      if (cookieTenantSlug) {
        tenant = await prisma.tenant.findUnique({ where: { slug: cookieTenantSlug } });
      } else if (cookieTenantId) {
        tenant = await prisma.tenant.findUnique({ where: { id: cookieTenantId } });
      }
    }
  }

  // 4. Fallback to primary default tenant if none specified
  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      where: { slug: "acme-wellness" },
    });

    if (!tenant) {
      tenant = await prisma.tenant.findFirst();
    }
  }

  if (!tenant) {
    return null;
  }

  return {
    tenant,
    tenantId: tenant.id,
  };
}
