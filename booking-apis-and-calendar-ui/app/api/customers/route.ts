import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

/**
 * GET /api/customers
 * Retrieves customers for the current tenant with booking statistics.
 */
export async function GET(req: NextRequest) {
  try {
    const tenantCtx = await resolveTenant(req);
    if (!tenantCtx) {
      return apiError("UNAUTHORIZED", "Tenant workspace not found", 401);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const where: { tenantId: string; OR?: Array<{ [key: string]: { contains: string; mode: "insensitive" } }> } = {
      tenantId: tenantCtx.tenantId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { bookings: true },
        },
        bookings: {
          select: {
            id: true,
            bookingDate: true,
            startTime: true,
            endTime: true,
            status: true,
            serviceName: true,
            price: true,
          },
          orderBy: { bookingDate: "desc" },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    });

    return apiSuccess(customers);
  } catch (error) {
    console.error("GET /api/customers internal error:", error);
    return apiError("INTERNAL_ERROR", "Failed to retrieve customers", 500);
  }
}

/**
 * POST /api/customers
 * Creates a new customer for the tenant.
 */
export async function POST(req: NextRequest) {
  try {
    const tenantCtx = await resolveTenant(req);
    if (!tenantCtx) {
      return apiError("UNAUTHORIZED", "Tenant workspace not found", 401);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("VALIDATION_ERROR", "Invalid JSON body", 400);
    }

    const parseResult = createCustomerSchema.safeParse(body);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return apiError("VALIDATION_ERROR", "Invalid customer data", 400, details);
    }

    const { name, email, phone, notes } = parseResult.data;

    // Check if customer email already exists in this tenant
    const existing = await prisma.customer.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenantCtx.tenantId,
          email: email.toLowerCase().trim(),
        },
      },
    });

    if (existing) {
      return apiError("VALIDATION_ERROR", "A customer with this email already exists in this workspace", 409);
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId: tenantCtx.tenantId,
        name,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        notes: notes || null,
      },
    });

    return apiSuccess(customer, 201);
  } catch (error) {
    console.error("POST /api/customers internal error:", error);
    return apiError("INTERNAL_ERROR", "Failed to create customer", 500);
  }
}
