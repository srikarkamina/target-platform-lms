import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== ALL TABLES ===");
  const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
  );
  console.log("Tables:", tables.map(t => t.table_name));

  for (const table of tables) {
    const name = table.table_name;
    if (name.startsWith("_")) continue;
    try {
      const count = await prisma.$queryRawUnsafe<Array<{ count: BigInt }>>(
        `SELECT COUNT(*) FROM "${name}"`
      );
      console.log(`Table "${name}": ${count[0].count} rows`);
    } catch (err) {
      console.error(`Error counting table ${name}:`, err);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
