import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      name: true,
    },
    take: 10,
  });
  console.log("Database Users:");
  console.log(JSON.stringify(users, null, 2));
}

run();
