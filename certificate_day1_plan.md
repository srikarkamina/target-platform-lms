# Certificate Management Foundation Plan (Week 5 Day 1)

This document details the implementation plan for the Certificate Management Foundation backend. It details our code audit findings and outlines the database schema modifications, code services, validation schemas, API endpoints, and verification steps.

## System Audit Findings

1. **Multi-Tenant Isolation**: The LMS uses `instituteId` on models like `User`, `Course`, `Quiz`, and `Payment` to separate tenant data. Authenticators extract `instituteId` via the user details. We will enforce `instituteId` isolation on all `CertificateTemplate` and `Certificate` operations.
2. **File Upload & Storage**: Storage utilizes Supabase (`lib/supabase.ts`) through `supabaseAdmin` to bypass RLS. Our template models will store string URLs (`backgroundImage` and `signatureImage`).
3. **Authorization Patterns**: Located in `lib/authorization.ts`, featuring `authenticateRequest`, `getAuthorizedUser`, and role checks. Custom templates and certificates endpoints will verify that `ADMIN` or `SUPER_ADMIN` roles perform mutating actions, and `instituteId` matches.
4. **Dashboard & Course Completion Tracking**: Completion is calculated dynamically inside routes by comparing completed video progress (`Progress` model) against total course videos.

---

## Proposed Database Architecture

We will modify `prisma/schema.prisma` to include the `CertificateTemplate` model and redefine/expand the `Certificate` model.

### 1. `CertificateTemplate` Model [NEW]
Stores design and metadata configurations for certificates of each institute.

```prisma
model CertificateTemplate {
  id              String        @id @default(uuid())
  instituteId     String
  name            String
  title           String
  description     String?
  backgroundImage String?
  signatureImage  String?
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  institute       Institute     @relation(fields: [instituteId], references: [id])
  certificates    Certificate[]

  @@index([instituteId])
  @@index([deletedAt])
}
```

### 2. `Certificate` Model [MODIFY]
Refactored to map all target fields, including a relation to the custom templates.

```prisma
model Certificate {
  id                String              @id @default(uuid())
  instituteId       String
  studentId         String
  courseId          String
  templateId        String
  certificateNumber String              @unique
  certificateCode   String              @unique
  verificationToken String              @unique
  issueDate         DateTime            @default(now())
  completionDate    DateTime?
  certificateUrl    String?
  status            CertificateStatus   @default(ACTIVE)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  deletedAt         DateTime?

  institute         Institute           @relation(fields: [instituteId], references: [id])
  student           User                @relation(fields: [studentId], references: [id])
  course            Course              @relation(fields: [courseId], references: [id])
  template          CertificateTemplate @relation(fields: [templateId], references: [id])

  @@index([instituteId])
  @@index([studentId])
  @@index([courseId])
  @@index([templateId])
  @@index([deletedAt])
}
```

### 3. Relations updates in other models
- **`Institute`**:
  ```prisma
  certificates          Certificate[]
  certificateTemplates  CertificateTemplate[]
  ```
- **`User`** & **`Course`**: Keep their existing `certificates Certificate[]` relation fields.

---

## Certificate Identifier Engine

We will implement `lib/certificate.ts` to manage human-readable, secure, and collision-safe identifier generation:
1. `generateCertificateNumber(indexSequenceNumber: number)`: Returns standard format `CERT-YYYY-XXXXXX` (e.g. `CERT-2026-000001`).
2. `generateCertificateCode()`: A short unique alphanumeric uppercase string (e.g., `8-12 characters`) for validation.
3. `generateVerificationToken()`: A high-entropy secure hex token (e.g., 64-character SHA256/crypto-random hex) for verification checks.

---

## Validation Schemas

We will create `lib/validations/certificate.ts` containing Zod schemas for:
- **Create Template Schema**:
  - `name`: string, 1-255 characters
  - `title`: string, 1-255 characters
  - `description`: string optional
  - `backgroundImage`: string URL optional/nullable
  - `signatureImage`: string URL optional/nullable
  - `isActive`: boolean optional
- **Update Template Schema**:
  - Partial of Create Template Schema
- **Generate Certificate Schema**:
  - `studentId`: UUID
  - `courseId`: UUID
  - `templateId`: UUID
  - `completionDate`: Date optional

---

## Template Management APIs

We will create the following handlers:
- **`app/api/certificate-templates/route.ts`**
  - `GET`: List active/all templates. Restricted to authenticated users belonging to the matching `instituteId` (Admins and Faculty). Super Admins bypass tenant checks.
  - `POST`: Create template. Validate schema. Institute ID defaults to the authenticated user's institute (Admins) or input (Super Admins). Only `ADMIN` or `SUPER_ADMIN` can create.
- **`app/api/certificate-templates/[id]/route.ts`**
  - `GET`: Retrieve a single template. Check tenant boundary.
  - `PUT`: Update details. Zod validate input. Check role (`ADMIN` or `SUPER_ADMIN`) and tenant boundary.
  - `DELETE`: Perform soft-delete by setting `deletedAt = new Date()` and `isActive = false`. Check role and tenant.

---

## Certificate Service Foundation

We will implement helper routines in `lib/services/certificate-service.ts`:
- `getTemplate(id: string, instituteId: string)`: Retrieve and throw if not found or tenant mismatched.
- `validateTemplate(template: CertificateTemplate)`: Confirm template is active.
- `checkDuplicateCertificate(studentId: string, courseId: string)`: Return existing active certificate if already generated.
- `prepareCertificateMetadata(params: { studentId: string, courseId: string, templateId: string, instituteId: string })`: Call the ID engine and build certificate data objects.

---

## Verification Plan

### Automated Tests
We will build a TS executable script in `scratch/test-certificate-foundation.ts` which executes:
1. Database operations for CRUD on templates.
2. Zod validations and verification.
3. Tenant isolation constraints checks (modifying templates across tenants should fail).
4. Generating identifiers and testing uniqueness.

To run:
```bash
npx prisma generate
npx tsx scratch/test-certificate-foundation.ts
```

### Type and Schema Compilation
```bash
npx prisma generate
npx tsc --noEmit
```
