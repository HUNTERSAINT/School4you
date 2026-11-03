# School4you

School4you is a multi-school management application by **Mazi Saint Concepts**. It brings student records, school fees, academic results and attendance into one workspace.

## Implemented

- Next.js App Router, TypeScript and Tailwind CSS
- School onboarding and administrator login with bcrypt password hashing and signed, HTTP-only session cookies; sessions are re-checked against the database on every request and are invalidated when a password changes
- School-scoped Prisma/PostgreSQL schema and APIs (every query filters by the signed-in user's school)
- Role-based access: **School admin** (everything), **Teacher** (students, attendance and results for the classes assigned to them), **Bursar** (students and fees)
- Student registration, editing, archiving, class/subject setup and staff account management
- Terms and sessions: add terms, edit dates, and switch the current term (the overview, fees and results default to it)
- Fee invoices, partial-payment calculations in whole kobo, Paystack initialization, signed webhook verification and server-side transaction verification, overpayment protection and audit logging
- Daily attendance with present, absent, late and excused statuses
- CA/exam score entry with configurable subject maximums, percentage-based grading, class average, class position (ranked by average percentage) and a printable report card with school name, session and term
- Password change for every user and password reset for staff by an administrator
- Login and registration rate limiting, security headers, and a middleware that redirects signed-out visitors to the login page
- Audit log entries for key operations

## Important status notes

- Dashboard statistics are database-backed. No demo records are inserted automatically.
- A school administrator must register a school, create classes and subjects, register students, assign teachers to classes and create fee invoices.
- Paystack requires a live `PAYSTACK_SECRET_KEY` in the deployment environment. Configure the Paystack webhook to `https://YOUR_DOMAIN/api/fees/webhook`. Never commit gateway keys.
- **All schools currently share one Paystack account.** Before collecting real fees for several schools, move to Paystack subaccounts or split payments so each school's money is settled to its own account.
- Rate limiting is in-memory and protects a single server instance. If you run more than one instance, back it with Redis or a similar shared store.
- Not implemented yet: email verification and "forgot password" emails, email/SMS notifications, parent and student portals, a result publishing workflow, and downloadable PDF report cards (use the print dialog and "Save as PDF").
- The first academic year and term created at onboarding follow the September to July calendar. Confirm the dates under Settings, then add later terms there.

## Local setup

Requirements: Node.js 22.18 or newer, and PostgreSQL.

1. Install dependencies: `npm install` (commit the generated `package-lock.json`)
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL` to your PostgreSQL connection string.
4. Generate a secure `AUTH_SECRET` (at least 32 characters).
5. Create the database tables: `npm run db:migrate -- --name init` for a fresh database (see "Database changes" below)
6. Start development: `npm run dev`
7. Open [http://localhost:3000](http://localhost:3000) and create the first school at `/register`.

Run the checks with `npm run lint`, `npm run typecheck` and `npm test`.

## Environment variables

| Variable              | Required      | Purpose                                             |
|-----------------------|---------------|-----------------------------------------------------|
| `DATABASE_URL`        | Yes           | PostgreSQL connection                               |
| `AUTH_SECRET`         | Yes           | Signs session tokens; use a unique random secret    |
| `AUTH_URL`            | Production    | Public base URL and payment callback                |
| `PAYSTACK_SECRET_KEY` | For live fees | Server-side payment initialization and verification |
| `RESEND_API_KEY`      | Optional      | Reserved for future email notifications             |

## Database changes

Use migrations, not `db:push`, once a school has real data: `prisma db push` can drop columns and data.

- New project: `npm run db:migrate -- --name init`, commit the generated `prisma/migrations` folder, and run `npm run db:deploy` on every deployment.
- Existing database that was created with `db:push`: create a baseline migration, mark it as applied with `prisma migrate resolve --applied <name>`, then apply later changes with migrations. Back up the database first.

This release adds a `TeacherAssignment` table, a `User.sessionVersion` column, and changes the student→invoice and student/invoice→payment relations so financial records are never deleted automatically.

**Existing teachers:** teachers can only work with classes assigned to them. After upgrading, an administrator must assign each teacher's classes under Settings, otherwise they will see no classes.

## Security notes

- Never commit secrets or production environment files.
- Payment statuses change only after a verified Paystack transaction or valid HMAC-signed webhook.
- All operational data queries are scoped to the authenticated user's school, and role checks limit what each role can read and change.
- Use HTTPS in production and restrict GitHub repository visibility.
- Back up the production database before schema changes.

## Deployment

Railway is the intended hosting platform. Provision PostgreSQL, configure `DATABASE_URL`, `AUTH_SECRET` and `AUTH_URL`, and deploy the `main` branch. Run `npm run db:deploy` once the database is connected before onboarding real school data.
