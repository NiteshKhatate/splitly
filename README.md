# Splitly

Splitly is a Phase 1 shared-expense application built with Next.js, TypeScript, Prisma, PostgreSQL/Supabase, and Supabase Authentication. Monetary values are persisted in integer minor units, and each group has one authoritative currency.

## Local setup

Requirements: Node 22, pnpm 10.33.4, and a non-production Supabase project.

1. Copy `.env.example` to `.env.local` and replace every placeholder used by local development.
2. Apply the authoritative Prisma migration chain to the non-production database.
3. Install dependencies and start the application.

```bash
pnpm install --frozen-lockfile
pnpm db:deploy
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Never use production credentials for development or automated tests.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm check:schema
pnpm test --runInBand
pnpm build
```

The real PostgreSQL/RLS suite additionally requires the disposable variables documented in `.env.example` and [tests/integration/README.md](tests/integration/README.md):

```bash
pnpm test:integration
```

Authenticated Playwright tests require the E2E accounts from `.env.example`:

```bash
pnpm test:e2e
```

## Architecture and operations

- [System design](docs/system-design.md)
- [Build plan](docs/BUILD_PLAN.md)
- [Production-readiness audit](docs/PRODUCTION_READINESS_AUDIT.md)
- [Hardening status](docs/PRODUCTION_HARDENING_STATUS.md)
- [Operations runbook](docs/OPERATIONS.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)

Production schema changes are owned exclusively by `prisma/migrations`. Deploy with the protected production release workflow so migrations complete before the Vercel deployment is triggered. Do not use production accounts or data for tests.
