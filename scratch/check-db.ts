import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DB CHECK ===");
  const users = await prisma.user.findMany();
  console.log("Users:", users);

  const institutes = await prisma.institute.findMany({
    include: { settings: true },
  });
  console.log("Institutes:", JSON.stringify(institutes, null, 2));

  const settings = await prisma.instituteSettings.findMany();
  console.log("Settings:", settings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
