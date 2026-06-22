import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("=== USERS ===");
  users.forEach(u => {
    console.log(`User: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
