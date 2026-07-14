import { z } from "zod";

export const createPollSchema = z.object({
  question: z.string().min(1, "Question is required").max(500, "Question is too long"),
  type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE"]),
  anonymous: z.boolean().optional(),
  publicResults: z.boolean().optional(),
  allowVoteUpdate: z.boolean().optional(),
  expiryDate: z.coerce.date(),
  options: z.array(z.string().min(1, "Option text cannot be empty").max(200, "Option is too long")).min(2, "At least two options are required"),
});

export const votePollSchema = z.object({
  optionIds: z.array(z.string()).min(1, "At least one option must be selected"),
});
