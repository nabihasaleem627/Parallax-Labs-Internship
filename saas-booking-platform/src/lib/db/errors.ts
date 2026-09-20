import { Prisma } from "@prisma/client";

/** True when the error is a Prisma unique-constraint violation (P2002). */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
