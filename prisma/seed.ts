import { PrismaClient } from "../app/generated/prisma/client";
import { Role } from "../app/generated/prisma/enums";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const institute = await prisma.institute.create({
    data: {
      name: "TARGET Institute",
    },
  });

  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@target.com",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      instituteId: institute.id,
    },
  });

  console.log("✅ Institute Created");
  console.log("✅ Super Admin Created");
  console.log("📧 Email: admin@target.com");
  console.log("🔑 Password: 123456");
  console.log("🚀 Seed completed");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });