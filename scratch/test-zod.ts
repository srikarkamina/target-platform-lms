import { z } from "zod";

const schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  expired: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val === "true"),
});

console.log("Empty object parsing:");
const res1 = schema.safeParse({});
console.log(res1.success ? res1.data : res1.error);
