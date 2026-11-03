# School4you

School4you is a school management platform by **Mazi Saint Concepts** for student records, school-fee tracking, academic results and attendance.

## Current status

The repository now contains the initial responsive dashboard UI, a multi-school PostgreSQL/Prisma data model, and reusable fee-status and grading calculations. Dashboard figures and student rows are demonstration data only; authentication, database-backed screens and live payment processing are not implemented yet.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Recharts for dashboard visualisations
- PostgreSQL with Prisma schema for schools, users, classes, students, terms, fees, payments, attendance, results and audit logs
- Paystack planned for school-fee collection and verified webhook updates

## Getting started

1. Install Node.js 20.9 or later.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in local development values as features are added.
4. Generate the Prisma client: `npm run db:generate`
5. Apply database migrations after configuring PostgreSQL: `npm run db:migrate`
6. Start the development server: `npm run dev`
5. Open http://localhost:3000

## Planned modules

- School onboarding, authentication and role-based access
- Student profiles and class management
- Fee schedules, part-payments, receipts and Paystack webhook verification
- Subject setup, CA/exam entry, configurable grading and report cards
- Daily attendance and attendance history
- Reports, analytics, audit logs and backups

## Security principles

- Never commit real API keys, database credentials or authentication secrets.
- Payment status must only be updated after server-side gateway verification or a verified webhook; never trust a browser redirect alone.
- Every school-owned record must be scoped to its school.
- Keep an audit trail for financial and academic changes.
