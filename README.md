# School4you

School4you is a multi-school management application by **Mazi Saint Concepts**. It brings student records, school fees, academic results and attendance into one workspace.

## Implemented

- Next.js App Router, TypeScript and Tailwind CSS
- School onboarding and administrator login with bcrypt password hashing and signed, HTTP-only session cookies
- School-scoped Prisma/PostgreSQL schema and APIs
- Student registration, editing, archiving, class/subject setup and staff account management for teachers and bursars
- Fee invoices, partial-payment calculations, Paystack initialization, signed webhook verification and server-side transaction verification
- Daily attendance with present, absent, late and excused statuses
- CA/exam score entry, configurable subject maximum scores, automatic grades, report totals, class average, class position and printable report view
- Live dashboard statistics and audit log entries for key operations

## Important status notes

- Dashboard statistics are database-backed. No demo student or fee records are inserted automatically.
- A school administrator must register a school, then create classes and subjects, register students and create fee invoices.
- Paystack requires a live `PAYSTACK_SECRET_KEY` in the deployment environment. Configure the Paystack webhook to `https://YOUR_DOMAIN/api/fees/webhook`. Never commit gateway keys.
- Email notifications, parent/teacher self-service portals, password reset, fine-grained teacher assignments and downloadable PDF generation are not implemented yet.
- The report card currently uses the browser print dialog; use “Save as PDF” to export.
- The first term and academic year created at onboarding are starter defaults. Configure dates to match the school's actual calendar before production use.

## Local setup

Requirements: Node.js 20.9+ and PostgreSQL.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL` to your PostgreSQL connection string.
4. Generate a secure `AUTH_SECRET` (at least 32 characters).
5. Apply the schema: `npm run db:push`
6. Generate Prisma client: `npm run db:generate`
7. Start development: `npm run dev`
8. Open http://localhost:3000 and create the first school at `/register`.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `AUTH_SECRET` | Yes | Signs session tokens; use a unique random secret |
| `AUTH_URL` | Production | Public base URL and payment callback |
| `PAYSTACK_SECRET_KEY` | For live fees | Server-side payment initialization and verification |
| `RESEND_API_KEY` | Optional | Reserved for future email notifications |

## Security notes

- Never commit secrets or production environment files.
- Payment statuses change only after a verified Paystack transaction or valid HMAC-signed webhook.
- All operational data queries are scoped to the authenticated user's school.
- Use HTTPS in production and restrict GitHub repository visibility.
- Back up the production database before schema changes.

## Deployment

Railway is the intended hosting platform. Provision PostgreSQL, configure `DATABASE_URL`, `AUTH_SECRET` and `AUTH_URL`, and deploy the `main` branch. Run `npm run db:push` once the database is connected before onboarding real school data.
