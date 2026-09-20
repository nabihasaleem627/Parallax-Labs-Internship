import { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma";

export type DbTx = Prisma.TransactionClient;

/**
 * Runs `fn` inside a single database transaction where the Postgres GUC
 * `app.current_tenant_id` is set to the given tenant.
 *
 * The Row-Level Security policies on `User`, `Booking` and
 * `PasswordResetToken` only expose rows whose `tenant_id` matches that value,
 * so every query inside this callback is scoped to exactly one organization
 * at the database level — independent of any application logic.
 *
 * `set_config(..., true)` scopes the GUC to the transaction, so the value
 * never leaks to other connections or queries.
 */
export async function withTenantScope<T>(
  tenantId: string,
  fn: (tx: DbTx) => Promise<T>
): Promise<T> {
  return getPrisma().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}

/**
 * Pre-tenant operations (login, forgot password) must look up a user before
 * the tenant is known. This sets a short-lived bypass GUC for a single
 * transaction.
 *
 * SECURITY: use only for authentication lookups — never for general data
 * access. The GUC is scoped to the transaction and is never set from any
 * client-supplied input.
 */
export async function withAuthScope<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> {
  return getPrisma().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_tenant_isolation', 'on', true)`;
    return fn(tx);
  });
}
