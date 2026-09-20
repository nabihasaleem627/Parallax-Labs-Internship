import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let client: PrismaClient | null = null;

/**
 * Lazy singleton. The client is created on first use (never at import time),
 * so building the app does not require the database to be reachable.
 */
export function getPrisma(): PrismaClient {
  if (!client) {
    client = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
  }
  return client;
}
