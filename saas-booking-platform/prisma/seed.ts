/**
 * Seed script — creates two realistic organizations with users and bookings
 * to demonstrate tenant isolation end to end.
 *
 * It connects with DIRECT_URL (the owner role), because seeding is a
 * pre-tenant administrative operation. Run with: npm run db:seed
 *
 * All seeded accounts use the local demo password: Password123!
 * (Local development only — never use these credentials in production.)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" },
  },
});

const DAY_MS = 24 * 60 * 60 * 1000;

function daysFromNow(days: number, hour = 10, minute = 0): Date {
  const date = new Date(Date.now() + days * DAY_MS);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  console.log("Seeding database…");

  const passwordHash = await bcrypt.hash("Password123!", 12);
  const now = new Date();

  // Start clean so seeding is idempotent.
  await prisma.booking.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // ---------------------------------------------------------------------
  // Organization 1: Acme Consulting
  // ---------------------------------------------------------------------
  const acme = await prisma.tenant.create({
    data: { name: "Acme Consulting", subdomain: "acme", plan: "free" },
  });

  const acmeAdmin = await prisma.user.create({
    data: { tenantId: acme.id, email: "admin@acme.test", name: "Ava Morgan", passwordHash, role: "ORG_ADMIN" },
  });
  const acmeStaff = await prisma.user.create({
    data: { tenantId: acme.id, email: "staff@acme.test", name: "Sam Rivera", passwordHash, role: "STAFF" },
  });
  const acmeMember = await prisma.user.create({
    data: { tenantId: acme.id, email: "user@acme.test", name: "Jordan Lee", passwordHash, role: "USER" },
  });

  await prisma.booking.createMany({
    data: [
      {
        tenantId: acme.id,
        userId: acmeStaff.id,
        title: "Client strategy workshop",
        notes: "Q4 account planning with the Meridian account team.",
        startsAt: daysFromNow(2, 9, 30),
        endsAt: daysFromNow(2, 11, 30),
        status: "CONFIRMED",
      },
      {
        tenantId: acme.id,
        userId: acmeAdmin.id,
        title: "Quarterly planning session",
        startsAt: daysFromNow(6, 13, 0),
        endsAt: daysFromNow(6, 16, 0),
        status: "PENDING",
      },
      {
        tenantId: acme.id,
        userId: acmeMember.id,
        title: "Sales enablement training",
        notes: "Onboarding module 2 — demo environment walkthrough.",
        startsAt: daysFromNow(12, 10, 0),
        endsAt: daysFromNow(12, 12, 0),
        status: "PENDING",
      },
      {
        tenantId: acme.id,
        userId: acmeStaff.id,
        title: "1:1 coaching call",
        startsAt: daysFromNow(-3, 15, 0),
        endsAt: daysFromNow(-3, 15, 45),
        status: "CONFIRMED",
      },
      {
        tenantId: acme.id,
        userId: acmeAdmin.id,
        title: "Project retrospective",
        notes: "Wind-down review for the Halcyon migration.",
        startsAt: daysFromNow(-10, 9, 0),
        endsAt: daysFromNow(-10, 10, 0),
        status: "CANCELLED",
      },
      {
        tenantId: acme.id,
        userId: acmeMember.id,
        title: "Board prep meeting",
        startsAt: daysFromNow(21, 14, 0),
        endsAt: daysFromNow(21, 15, 30),
        status: "CONFIRMED",
      },
    ],
  });

  // ---------------------------------------------------------------------
  // Organization 2: Nova Health
  // ---------------------------------------------------------------------
  const nova = await prisma.tenant.create({
    data: { name: "Nova Health", subdomain: "nova", plan: "free" },
  });

  const novaAdmin = await prisma.user.create({
    data: { tenantId: nova.id, email: "admin@nova.test", name: "Nadia Khan", passwordHash, role: "ORG_ADMIN" },
  });
  const novaStaff = await prisma.user.create({
    data: { tenantId: nova.id, email: "staff@nova.test", name: "Omar Farooq", passwordHash, role: "STAFF" },
  });
  const novaMember = await prisma.user.create({
    data: { tenantId: nova.id, email: "user@nova.test", name: "Priya Sharma", passwordHash, role: "USER" },
  });

  await prisma.booking.createMany({
    data: [
      {
        tenantId: nova.id,
        userId: novaStaff.id,
        title: "Patient intake consult",
        notes: "New patient — prepare intake packet beforehand.",
        startsAt: daysFromNow(1, 8, 30),
        endsAt: daysFromNow(1, 9, 15),
        status: "CONFIRMED",
      },
      {
        tenantId: nova.id,
        userId: novaAdmin.id,
        title: "Nurse shift planning",
        startsAt: daysFromNow(4, 11, 0),
        endsAt: daysFromNow(4, 12, 0),
        status: "PENDING",
      },
      {
        tenantId: nova.id,
        userId: novaMember.id,
        title: "Physiotherapy assessment",
        startsAt: daysFromNow(8, 16, 30),
        endsAt: daysFromNow(8, 17, 15),
        status: "CONFIRMED",
      },
      {
        tenantId: nova.id,
        userId: novaStaff.id,
        title: "Health screening clinic",
        notes: "Bring screening forms and prior lab results.",
        startsAt: daysFromNow(-5, 9, 0),
        endsAt: daysFromNow(-5, 13, 0),
        status: "CONFIRMED",
      },
      {
        tenantId: nova.id,
        userId: novaAdmin.id,
        title: "Telehealth check-in",
        startsAt: daysFromNow(-1, 17, 0),
        endsAt: daysFromNow(-1, 17, 30),
        status: "CANCELLED",
      },
      {
        tenantId: nova.id,
        userId: novaMember.id,
        title: "Wellness workshop",
        notes: "Open session for all staff — room 2B.",
        startsAt: daysFromNow(15, 10, 0),
        endsAt: daysFromNow(15, 11, 30),
        status: "PENDING",
      },
    ],
  });

  const counts = {
    tenants: await prisma.tenant.count(),
    users: await prisma.user.count(),
    bookings: await prisma.booking.count(),
    seededAt: now,
  };

  console.log(`Seeded ${counts.tenants} organizations, ${counts.users} users, ${counts.bookings} bookings.`);
  console.log("");
  console.log("Test accounts (local development only, password: Password123!):");
  console.log("  Acme Consulting  admin@acme.test (Org Admin)  staff@acme.test (Staff)  user@acme.test (Member)");
  console.log("  Nova Health      admin@nova.test (Org Admin)  staff@nova.test (Staff)  user@nova.test (Member)");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
