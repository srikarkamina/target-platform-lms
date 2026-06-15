import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "rahul2@student.com" }
  });
  if (user) {
    const isMatch = await bcrypt.compare("123456", user.password);
    console.log("Password matches '123456':", isMatch);
  } else {
    console.log("User not found");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
