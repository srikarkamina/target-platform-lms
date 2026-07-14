# Certificate Revocation Audit Report

This report presents the investigation, schema updates, code refactoring, and verification outcomes to implement soft certificate revocation instead of complete soft-deletion.

---

## 1. Issue Description & Root Cause
* **Current Behavior**: Previously, when an administrator clicked the revoke button, the certificate disappeared completely from the dashboard registry and all search views. Statistics for `Total Issued`, `Active`, and `Revoked` collapsed to `0` instead of counting historical entries.
* **Root Cause**: The DELETE handler in `app/api/certificates/[id]/route.ts` set the `deletedAt` column of the `Certificate` to `new Date()`. The registry GET API `app/api/certificates/route.ts` queries where `deletedAt: null`. Consequently, setting `deletedAt` completely filtered revoked certificates out of all search lists and dashboards.

---

## 2. Refactored Revocation Logic (Soft State Change)
We replaced the deletion behavior with a state change to `REVOKED`:
1. **Prisma Model**: Added `revokedAt DateTime?` to the `Certificate` model to track when revocation happened without setting the `deletedAt` field.
2. **API Endpoint**: Refactored the DELETE handler in `app/api/certificates/[id]/route.ts` to update `status` to `"REVOKED"` and set `revokedAt: new Date()`, leaving `deletedAt` as `null`.
3. **Registry Visibility**: Since `deletedAt` is untouched, standard registry queries fetch both ACTIVE and REVOKED certificates. They remain searchable, visible, and printable, but display the custom status badge correctly.
4. **Statistics Calculations**: The frontend now processes the retrieved collection:
   - `Total Issued` = length of all certificates (Active + Revoked).
   - `Active` = certificates with `status === "ACTIVE"`.
   - `Revoked` = certificates with `status === "REVOKED"`.
   - Correctly yields: **Total Issued = 1, Active = 0, Revoked = 1** for single revoked credentials.

---

## 3. Database Modifications & Migrations
1. **Schema Update**: Added `revokedAt DateTime?` under `deletedAt` inside [prisma/schema.prisma](file:///d:/target/target_platform/prisma/schema.prisma).
2. **DB Sync**: Ran `npx prisma db push` to add the column to PostgreSQL.
3. **Migration Record**: Documented the migration SQL inside a new folder:
   - [prisma/migrations/20260624020000_add_revoked_at_to_certificate/migration.sql](file:///d:/target/target_platform/prisma/migrations/20260624020000_add_revoked_at_to_certificate/migration.sql).
   - Marked the migration as applied via `npx prisma migrate resolve --applied 20260624020000_add_revoked_at_to_certificate`.
4. **Final Migration Status**: Database status verified as synchronized with **13 migrations**.

---

## 4. Verification & Testing Outcomes

### **Automated Test Results**
We ran the dedicated test suite:
`npx tsx --env-file=.env scratch/test-revocation-audit.ts`

**Output Logs**:
```
=== STARTING CERTIFICATE REVOCATION AUDIT TESTS ===
Generating active certificate...
Issued Certificate ID: c4f4b46f-f364-44bb-a237-59756cdb8d5c
Initial Status: ACTIVE

Revoking certificate...
Updated Status: REVOKED
deletedAt: null
revokedAt: Wed Jun 24 2026 02:00:48 GMT+0530 (India Standard Time)
✅ Soft Revocation State Checks Passed!

Querying registry...
Certificates returned in search: 1
✅ Registry Visibility Checks Passed!

Calculating statistics...
Total Issued: 1
Active: 0
Revoked: 1
✅ Statistics Calculation Checks Passed!

Cleaning up test records...
Cleanup complete.
```
* **Result**: **All revocation state checks, visibility queries, and statistics calculations passed successfully.**

---

## 5. Build and Compilation Status
* **TypeScript Compilation**: Checked via `npx tsc --noEmit` and passed cleanly with **0 errors**.
* **Next.js Production Build**: Succeeded via `npm run build` with **0 errors**.

---

## 6. Recommendation
### 🟢 SAFE TO PROCEED

The certificate revocation is now a safe soft-state change. All statistics and filters reflect correctly, and the registry retains historical credentials.
