# Certificate Generation Engine & UI Plan (Week 5 Day 2)

This document outlines the detailed implementation plan for the Certificate Generation Engine, REST APIs, reusable frontend components, and dashboard management views.

---

## Proposed Changes

### 1. `lib/services/certificate-service.ts` [MODIFY]
We will add `generateCertificate()` to handle transactional creation:
1. Validate student exists, belongs to the tenant, and has the `STUDENT` role.
2. Validate course exists and belongs to the tenant.
3. Validate course completion (verify all published videos in the course have completed progress records for the student).
4. Validate template exists, is active, and belongs to the tenant.
5. Check for duplicate active certificates (prevent double issuance).
6. Perform creation within a database transaction:
   - Query certificate count to generate sequential `certificateNumber`.
   - Write the `Certificate` record.

### 2. REST API Endpoints
We will create three endpoint routes:
* **`app/api/certificates/route.ts` [NEW]**
  - `GET`: Fetch certificates list with search (student name, certificate number) and filter (courseId, status) options. Enforce tenant isolation. Restricted to `ADMIN`, `SUPER_ADMIN`, and `FACULTY`.
* **`app/api/certificates/[id]/route.ts` [NEW]**
  - `GET`: Retrieve specific certificate details by ID. Verifies tenant boundary. Allowed for matching student, course faculty, institute admins, and super admins.
  - `DELETE`: Revoke/Soft delete a certificate (set `deletedAt` / change status). Restricted to `ADMIN` / `SUPER_ADMIN`.
* **`app/api/certificates/generate/route.ts` [NEW]**
  - `POST`: Handle programmatic/manual certificate generation. Zod validates request body. Invokes `generateCertificate()` within the service layer. Restricted to `ADMIN` and `SUPER_ADMIN`.

### 3. Component Library
We will create a series of component files under `components/certificates/`:
* `CertificateTable.tsx`: Display certificates with search, filter, sorting, pagination, and revocation action.
* `CertificateStats.tsx`: Key metrics (Total Issued, Active, Revoked, Templates Active).
* `CertificateForm.tsx`: Modal/form to manually select student and course to trigger certificate generation.
* `TemplateForm.tsx`: Modal/form to create or edit templates (name, title, description, backgrounds).
* `TemplatePreview.tsx`: Real-time visual render of what the certificate looks like with dynamic variables (Student Name, Course Title, Date, Certificate Number, Signature).

### 4. Dashboard Pages
* **`app/dashboard/certificates/page.tsx` [NEW]**
  - Standard wrapper layout. Fetches statistics, lists courses and students for filtering, and presents the `CertificateTable` and `CertificateForm`.
* **`app/dashboard/certificate-templates/page.tsx` [NEW]**
  - Management UI for templates. Displays grid of templates, allows creating, toggling `isActive`, editing, soft-deleting, and launching `TemplatePreview`.

---

## Security Verification
1. **Tenant Isolation**: Direct equality checks `user.instituteId === resource.instituteId` for all queries.
2. **Access Control**: Write/Generate operations restricted to `ADMIN` and `SUPER_ADMIN`. GET lists restricted based on matching tenant boundary.
3. **Double Issuance Safeguard**: Unique index combined with database pre-checks before transaction execution.

---

## Verification Plan

### Automated Verification
Create [scratch/test-certificate-generation.ts](file:///d:/target/target_platform/scratch/test-certificate-generation.ts) verifying:
1. Eligibility verification (student has/hasn't completed videos).
2. Successful transactional generation.
3. Prevention of duplicate issuance.
4. Search/Filter DB query checks.
5. Soft delete/Revocation.

To run:
```bash
npx tsx --env-file=.env scratch/test-certificate-generation.ts
```

### Static Type Safety
```bash
npx prisma generate
npx tsc --noEmit
npm run build
```
