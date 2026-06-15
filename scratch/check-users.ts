import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, instituteId: true }
  });
  console.log(users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
