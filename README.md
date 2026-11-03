# School4you

School4you is a school management platform by **Mazi Saint Concepts** for student records, school-fee tracking, academic results and attendance.

## Current status

The repository contains the initial responsive dashboard UI and project foundation. Dashboard figures and student rows are demonstration data only; they are not connected to a live school database or payment provider yet.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Recharts for dashboard visualisations
- PostgreSQL planned for persistent school data
- Paystack planned for school-fee collection and verified webhook updates

## Getting started

1. Install Node.js 20.9 or later.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in local development values as features are added.
4. Start the development server: `npm run dev`
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
