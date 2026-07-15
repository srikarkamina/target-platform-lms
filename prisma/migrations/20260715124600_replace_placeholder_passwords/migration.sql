-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordSet" BOOLEAN NOT NULL DEFAULT false;

-- Migrate data
UPDATE "User"
SET "passwordHash" = CASE
    WHEN "password" LIKE 'NO_PASSWORD_SET_%' THEN NULL
    ELSE "password"
  END,
  "passwordSet" = CASE
    WHEN "password" LIKE 'NO_PASSWORD_SET_%' THEN false
    ELSE true
  END,
  "status" = CASE
    WHEN "password" LIKE 'NO_PASSWORD_SET_%' THEN 'PENDING_INVITE'::"UserStatus"
    ELSE "status"
  END;

-- Drop old password column
ALTER TABLE "User" DROP COLUMN "password";
