import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "owner@bookit.dev" },
    update: {},
    create: {
      email: "owner@bookit.dev",
      passwordHash: "dev-only-placeholder-hash",
      role: "OWNER",
    },
  });

  const name = "Sunset Cuts Barbershop";
  const existing = await prisma.business.findFirst({ where: { ownerId: owner.id, name } });
  const business =
    existing ??
    (await prisma.business.create({
      data: {
        ownerId: owner.id,
        name,
        description: "Walk-ins welcome, appointments preferred.",
        timezone: "America/New_York",
        services: {
          create: [
            { name: "Haircut", durationMinutes: 30, priceCents: 3500 },
            { name: "Haircut + Beard Trim", durationMinutes: 45, priceCents: 5000 },
          ],
        },
        availability: {
          // Mon-Fri, 9:00 AM - 5:00 PM
          create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
            dayOfWeek,
            startMinute: 9 * 60,
            endMinute: 17 * 60,
          })),
        },
      },
    }));

  const customer = await prisma.user.upsert({
    where: { email: "customer@bookit.dev" },
    update: {},
    create: {
      email: "customer@bookit.dev",
      passwordHash: "dev-only-placeholder-hash",
      role: "CUSTOMER",
    },
  });

  console.log({ owner: owner.email, business: business.name, customer: customer.email });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
