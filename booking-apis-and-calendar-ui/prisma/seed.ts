import { PrismaClient, BookingStatus, UserRole } from "@prisma/client";
import { addDays, format, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding multi-tenant SaaS booking platform...");

  // Clean existing data for clean seed runs
  await prisma.idempotencyKey.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // 1. Acme Wellness Clinic
  const acme = await prisma.tenant.create({
    data: {
      slug: "acme-wellness",
      name: "Acme Wellness Clinic",
      industry: "Healthcare & Therapy",
      email: "contact@acmewellness.com",
      phone: "+1 (555) 234-5678",
      timezone: "America/New_York",
      currency: "USD",
      businessHoursStart: "08:30",
      businessHoursEnd: "17:30",
      workingDays: "1,2,3,4,5",
      users: {
        create: [
          {
            name: "Dr. Sarah Jenkins",
            email: "sarah@acmewellness.com",
            role: UserRole.ADMIN,
          },
          {
            name: "Marcus Vance",
            email: "marcus@acmewellness.com",
            role: UserRole.STAFF,
          },
        ],
      },
      services: {
        create: [
          {
            name: "Initial Health Consultation",
            durationMinutes: 60,
            price: 150,
            color: "#3b82f6", // blue
          },
          {
            name: "Follow-up Wellness Check",
            durationMinutes: 30,
            price: 85,
            color: "#10b981", // emerald
          },
          {
            name: "Physical Therapy Assessment",
            durationMinutes: 60,
            price: 175,
            color: "#8b5cf6", // violet
          },
          {
            name: "Nutritional Advisory Session",
            durationMinutes: 45,
            price: 110,
            color: "#f59e0b", // amber
          },
        ],
      },
      customers: {
        create: [
          {
            name: "Eleanor Vance",
            email: "eleanor.vance@example.com",
            phone: "+1 (555) 987-6543",
            notes: "Prefers morning appointments. Follow-up for knee therapy.",
          },
          {
            name: "David Kim",
            email: "david.kim@example.com",
            phone: "+1 (555) 876-5432",
            notes: "Annual executive health screening.",
          },
          {
            name: "Sophia Martinez",
            email: "sophia.m@example.com",
            phone: "+1 (555) 765-4321",
            notes: "Referred by Dr. Chen.",
          },
          {
            name: "James Wilson",
            email: "j.wilson@example.com",
            phone: "+1 (555) 654-3210",
            notes: "Nutritional adjustment plan.",
          },
          {
            name: "Amara Okafor",
            email: "amara.o@example.com",
            phone: "+1 (555) 543-2109",
            notes: "Holistic wellness intake.",
          },
        ],
      },
    },
    include: {
      services: true,
      customers: true,
      users: true,
    },
  });

  // 2. Lumina Creative Studio (Agencies / Consultants)
  const lumina = await prisma.tenant.create({
    data: {
      slug: "lumina-creative",
      name: "Lumina Design & Strategy",
      industry: "Design & Consulting",
      email: "hello@luminadesign.io",
      phone: "+1 (555) 345-6789",
      timezone: "America/Los_Angeles",
      currency: "USD",
      businessHoursStart: "09:00",
      businessHoursEnd: "18:00",
      workingDays: "1,2,3,4,5",
      users: {
        create: [
          {
            name: "Elena Rostova",
            email: "elena@luminadesign.io",
            role: UserRole.ADMIN,
          },
        ],
      },
      services: {
        create: [
          {
            name: "Brand Discovery & Architecture",
            durationMinutes: 90,
            price: 350,
            color: "#6366f1",
          },
          {
            name: "UX/UI Design Sprint Review",
            durationMinutes: 60,
            price: 220,
            color: "#06b6d4",
          },
          {
            name: "Product Strategy Advisory",
            durationMinutes: 45,
            price: 180,
            color: "#ec4899",
          },
        ],
      },
      customers: {
        create: [
          {
            name: "Thomas Sterling",
            email: "thomas@sterlingtech.co",
            phone: "+1 (555) 432-1098",
            notes: "Series A startup redesign consultation.",
          },
          {
            name: "Chloe Dupont",
            email: "chloe@modefashion.com",
            phone: "+1 (555) 321-0987",
            notes: "E-commerce rebrand kickoff.",
          },
        ],
      },
    },
    include: {
      services: true,
      customers: true,
      users: true,
    },
  });

  // 3. Apex Performance Lab (Fitness & Sports)
  const apex = await prisma.tenant.create({
    data: {
      slug: "apex-fitness",
      name: "Apex Performance Lab",
      industry: "Fitness & Athletics",
      email: "team@apexperformance.fit",
      phone: "+1 (555) 456-7890",
      timezone: "America/Chicago",
      currency: "USD",
      businessHoursStart: "06:00",
      businessHoursEnd: "20:00",
      workingDays: "1,2,3,4,5,6",
      users: {
        create: [
          {
            name: "Coach Ryan Brooks",
            email: "ryan@apexperformance.fit",
            role: UserRole.ADMIN,
          },
        ],
      },
      services: {
        create: [
          {
            name: "1-on-1 Elite Athletic Training",
            durationMinutes: 60,
            price: 120,
            color: "#ef4444",
          },
          {
            name: "VO2 Max & Metabolic Testing",
            durationMinutes: 45,
            price: 160,
            color: "#14b8a6",
          },
        ],
      },
      customers: {
        create: [
          {
            name: "Lucas Rivera",
            email: "lucas.rivera@example.com",
            phone: "+1 (555) 210-9876",
            notes: "Marathon prep training block.",
          },
        ],
      },
    },
    include: {
      services: true,
      customers: true,
      users: true,
    },
  });

  // Create realistic bookings for Acme Wellness
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const adminUser = acme.users[0];
  const sConsult = acme.services[0];
  const sFollowup = acme.services[1];
  const sTherapy = acme.services[2];
  const sNutrition = acme.services[3];

  const cEleanor = acme.customers[0];
  const cDavid = acme.customers[1];
  const cSophia = acme.customers[2];
  const cJames = acme.customers[3];
  const cAmara = acme.customers[4];

  // Helper to build Date objects
  const makeDate = (dayOffset: number, hour: number, minute: number = 0) => {
    const d = addDays(today, dayOffset);
    return setMinutes(setHours(d, hour), minute);
  };

  const bookingSeeds = [
    // Today's Bookings
    {
      tenantId: acme.id,
      customerId: cEleanor.id,
      customerName: cEleanor.name,
      customerEmail: cEleanor.email,
      customerPhone: cEleanor.phone,
      serviceId: sConsult.id,
      serviceName: sConsult.name,
      bookingDate: today,
      startTime: "09:00",
      endTime: "10:00",
      startDateTime: makeDate(0, 9, 0),
      endDateTime: makeDate(0, 10, 0),
      status: BookingStatus.CONFIRMED,
      notes: "Follow-up consultation regarding initial scan results.",
      price: sConsult.price,
      createdById: adminUser.id,
    },
    {
      tenantId: acme.id,
      customerId: cDavid.id,
      customerName: cDavid.name,
      customerEmail: cDavid.email,
      customerPhone: cDavid.phone,
      serviceId: sTherapy.id,
      serviceName: sTherapy.name,
      bookingDate: today,
      startTime: "11:00",
      endTime: "12:00",
      startDateTime: makeDate(0, 11, 0),
      endDateTime: makeDate(0, 12, 0),
      status: BookingStatus.CONFIRMED,
      notes: "Post-rehab flexibility exercises.",
      price: sTherapy.price,
      createdById: adminUser.id,
    },
    {
      tenantId: acme.id,
      customerId: cSophia.id,
      customerName: cSophia.name,
      customerEmail: cSophia.email,
      customerPhone: cSophia.phone,
      serviceId: sFollowup.id,
      serviceName: sFollowup.name,
      bookingDate: today,
      startTime: "14:30",
      endTime: "15:00",
      startDateTime: makeDate(0, 14, 30),
      endDateTime: makeDate(0, 15, 0),
      status: BookingStatus.PENDING,
      notes: "Routine quarterly wellness follow up.",
      price: sFollowup.price,
      createdById: adminUser.id,
    },
    {
      tenantId: acme.id,
      customerId: cJames.id,
      customerName: cJames.name,
      customerEmail: cJames.email,
      customerPhone: cJames.phone,
      serviceId: sNutrition.id,
      serviceName: sNutrition.name,
      bookingDate: today,
      startTime: "16:00",
      endTime: "16:45",
      startDateTime: makeDate(0, 16, 0),
      endDateTime: makeDate(0, 16, 45),
      status: BookingStatus.CONFIRMED,
      notes: "Dietary plan adjustment.",
      price: sNutrition.price,
      createdById: adminUser.id,
    },

    // Tomorrow (Day +1)
    {
      tenantId: acme.id,
      customerId: cAmara.id,
      customerName: cAmara.name,
      customerEmail: cAmara.email,
      customerPhone: cAmara.phone,
      serviceId: sConsult.id,
      serviceName: sConsult.name,
      bookingDate: addDays(today, 1),
      startTime: "10:00",
      endTime: "11:00",
      startDateTime: makeDate(1, 10, 0),
      endDateTime: makeDate(1, 11, 0),
      status: BookingStatus.CONFIRMED,
      notes: "First appointment - requested comprehensive intake.",
      price: sConsult.price,
      createdById: adminUser.id,
    },
    {
      tenantId: acme.id,
      customerId: cEleanor.id,
      customerName: cEleanor.name,
      customerEmail: cEleanor.email,
      customerPhone: cEleanor.phone,
      serviceId: sTherapy.id,
      serviceName: sTherapy.name,
      bookingDate: addDays(today, 1),
      startTime: "13:00",
      endTime: "14:00",
      startDateTime: makeDate(1, 13, 0),
      endDateTime: makeDate(1, 14, 0),
      status: BookingStatus.CONFIRMED,
      notes: "Knee mobility test session.",
      price: sTherapy.price,
      createdById: adminUser.id,
    },

    // Day +2
    {
      tenantId: acme.id,
      customerId: cDavid.id,
      customerName: cDavid.name,
      customerEmail: cDavid.email,
      customerPhone: cDavid.phone,
      serviceId: sFollowup.id,
      serviceName: sFollowup.name,
      bookingDate: addDays(today, 2),
      startTime: "09:30",
      endTime: "10:00",
      startDateTime: makeDate(2, 9, 30),
      endDateTime: makeDate(2, 10, 0),
      status: BookingStatus.CONFIRMED,
      notes: "Blood pressure and vitals re-check.",
      price: sFollowup.price,
      createdById: adminUser.id,
    },
    {
      tenantId: acme.id,
      customerId: cJames.id,
      customerName: cJames.name,
      customerEmail: cJames.email,
      customerPhone: cJames.phone,
      serviceId: sNutrition.id,
      serviceName: sNutrition.name,
      bookingDate: addDays(today, 2),
      startTime: "15:00",
      endTime: "15:45",
      startDateTime: makeDate(2, 15, 0),
      endDateTime: makeDate(2, 15, 45),
      status: BookingStatus.PENDING,
      notes: "Monthly meal prep review.",
      price: sNutrition.price,
      createdById: adminUser.id,
    },

    // Day +3
    {
      tenantId: acme.id,
      customerId: cSophia.id,
      customerName: cSophia.name,
      customerEmail: cSophia.email,
      customerPhone: cSophia.phone,
      serviceId: sConsult.id,
      serviceName: sConsult.name,
      bookingDate: addDays(today, 3),
      startTime: "11:00",
      endTime: "12:00",
      startDateTime: makeDate(3, 11, 0),
      endDateTime: makeDate(3, 12, 0),
      status: BookingStatus.CONFIRMED,
      notes: "Functional health review.",
      price: sConsult.price,
      createdById: adminUser.id,
    },

    // Day -1 (Past Completed)
    {
      tenantId: acme.id,
      customerId: cEleanor.id,
      customerName: cEleanor.name,
      customerEmail: cEleanor.email,
      customerPhone: cEleanor.phone,
      serviceId: sConsult.id,
      serviceName: sConsult.name,
      bookingDate: addDays(today, -1),
      startTime: "09:00",
      endTime: "10:00",
      startDateTime: makeDate(-1, 9, 0),
      endDateTime: makeDate(-1, 10, 0),
      status: BookingStatus.COMPLETED,
      notes: "Completed comprehensive consultation and ordered baseline tests.",
      price: sConsult.price,
      createdById: adminUser.id,
    },
    {
      tenantId: acme.id,
      customerId: cDavid.id,
      customerName: cDavid.name,
      customerEmail: cDavid.email,
      customerPhone: cDavid.phone,
      serviceId: sFollowup.id,
      serviceName: sFollowup.name,
      bookingDate: addDays(today, -1),
      startTime: "14:00",
      endTime: "14:30",
      startDateTime: makeDate(-1, 14, 0),
      endDateTime: makeDate(-1, 14, 30),
      status: BookingStatus.CANCELLED,
      notes: "Cancelled by client due to work conflict.",
      price: sFollowup.price,
      createdById: adminUser.id,
    },

    // Day -2 (Past Completed)
    {
      tenantId: acme.id,
      customerId: cAmara.id,
      customerName: cAmara.name,
      customerEmail: cAmara.email,
      customerPhone: cAmara.phone,
      serviceId: sTherapy.id,
      serviceName: sTherapy.name,
      bookingDate: addDays(today, -2),
      startTime: "11:00",
      endTime: "12:00",
      startDateTime: makeDate(-2, 11, 0),
      endDateTime: makeDate(-2, 12, 0),
      status: BookingStatus.COMPLETED,
      notes: "Session completed successfully.",
      price: sTherapy.price,
      createdById: adminUser.id,
    },
  ];

  for (const b of bookingSeeds) {
    await prisma.booking.create({ data: b });
  }

  // Seed Lumina Creative bookings
  const luminaServices = lumina.services;
  const luminaCustomers = lumina.customers;
  await prisma.booking.createMany({
    data: [
      {
        tenantId: lumina.id,
        customerId: luminaCustomers[0].id,
        customerName: luminaCustomers[0].name,
        customerEmail: luminaCustomers[0].email,
        customerPhone: luminaCustomers[0].phone,
        serviceId: luminaServices[0].id,
        serviceName: luminaServices[0].name,
        bookingDate: today,
        startTime: "10:30",
        endTime: "12:00",
        startDateTime: makeDate(0, 10, 30),
        endDateTime: makeDate(0, 12, 0),
        status: BookingStatus.CONFIRMED,
        notes: "Design sprint kick-off workshop with leadership team.",
        price: luminaServices[0].price,
      },
      {
        tenantId: lumina.id,
        customerId: luminaCustomers[1].id,
        customerName: luminaCustomers[1].name,
        customerEmail: luminaCustomers[1].email,
        customerPhone: luminaCustomers[1].phone,
        serviceId: luminaServices[1].id,
        serviceName: luminaServices[1].name,
        bookingDate: addDays(today, 1),
        startTime: "14:00",
        endTime: "15:00",
        startDateTime: makeDate(1, 14, 0),
        endDateTime: makeDate(1, 15, 0),
        status: BookingStatus.CONFIRMED,
        notes: "Sprint review & clickable prototype presentation.",
        price: luminaServices[1].price,
      },
    ],
  });

  // Seed Apex Performance bookings
  const apexServices = apex.services;
  const apexCustomers = apex.customers;
  await prisma.booking.createMany({
    data: [
      {
        tenantId: apex.id,
        customerId: apexCustomers[0].id,
        customerName: apexCustomers[0].name,
        customerEmail: apexCustomers[0].email,
        customerPhone: apexCustomers[0].phone,
        serviceId: apexServices[0].id,
        serviceName: apexServices[0].name,
        bookingDate: today,
        startTime: "07:00",
        endTime: "08:00",
        startDateTime: makeDate(0, 7, 0),
        endDateTime: makeDate(0, 8, 0),
        status: BookingStatus.CONFIRMED,
        notes: "High-intensity aerobic conditioning block.",
        price: apexServices[0].price,
      },
    ],
  });

  console.log("✅ Multi-tenant seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
