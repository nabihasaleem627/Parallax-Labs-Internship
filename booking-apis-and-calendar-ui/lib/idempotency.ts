import prisma from "@/lib/prisma";
import { addHours } from "date-fns";

export interface StoredResponse {
  status: number;
  body: unknown;
}

/**
 * Retrieves a previously completed response for the given idempotency key and tenant.
 * Reusing the previous response prevents duplicate bookings when the client retries
 * the same request after a network timeout or browser refresh.
 */
export async function getStoredIdempotencyResponse(
  tenantId: string,
  key: string
): Promise<StoredResponse | null> {
  if (!key || key.trim() === "") return null;

  try {
    const record = await prisma.idempotencyKey.findUnique({
      where: {
        tenantId_key: {
          tenantId,
          key: key.trim(),
        },
      },
    });

    if (!record) return null;

    // Check expiration (default TTL: 24 hours)
    if (new Date() > record.expiresAt) {
      await prisma.idempotencyKey.delete({ where: { id: record.id } }).catch(() => {});
      return null;
    }

    return {
      status: record.responseStatus,
      body: JSON.parse(record.responseBody),
    };
  } catch (error) {
    console.error("Error looking up idempotency key:", error);
    return null;
  }
}

/**
 * Persists the result of a successful or handled API mutation in the database.
 */
export async function saveIdempotencyResponse(
  tenantId: string,
  key: string,
  requestPath: string,
  requestParams: unknown,
  status: number,
  body: unknown
): Promise<void> {
  if (!key || key.trim() === "") return;

  try {
    const expiresAt = addHours(new Date(), 24);

    await prisma.idempotencyKey.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key: key.trim(),
        },
      },
      create: {
        key: key.trim(),
        tenantId,
        requestPath,
        requestParams: requestParams ? JSON.stringify(requestParams) : null,
        responseStatus: status,
        responseBody: JSON.stringify(body),
        expiresAt,
      },
      update: {
        responseStatus: status,
        responseBody: JSON.stringify(body),
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Failed to save idempotency response:", error);
  }
}
