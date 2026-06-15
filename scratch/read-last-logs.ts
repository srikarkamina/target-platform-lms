import fs from "fs";

try {
  const content = fs.readFileSync("d:/target/target_platform/.next/dev/logs/next-development.log", "utf8");
  const lines = content.split("\n").filter(Boolean);
  console.log(`Total lines: ${lines.length}`);
  const last50 = lines.slice(-50);
  for (const line of last50) {
    try {
      const parsed = JSON.parse(line);
      console.log(`[${parsed.timestamp}] [${parsed.source}] [${parsed.level}]`, parsed.message);
    } catch {
      console.log(line);
    }
  }
} catch (e: any) {
  console.error(e.message);
}
