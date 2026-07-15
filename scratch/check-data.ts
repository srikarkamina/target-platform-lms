import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const institutes = await prisma.institute.findMany();
  console.log("Institutes in database:", institutes.length);
  institutes.forEach(i => {
    console.log(`- ${i.name} (${i.id})`);
  });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      instituteId: true,
    }
  });
  console.log("Users in database:", users.length);
  users.forEach(u => {
    console.log(`- ${u.name} <${u.email}> | Role: ${u.role} | Institute: ${u.instituteId}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
