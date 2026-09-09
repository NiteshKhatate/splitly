# Database integration tests

These tests mutate only a disposable, non-production Supabase project. They prove real PostgreSQL rollback and two-user RLS behavior and must never use production credentials.

Required environment variables:

```text
TEST_DATABASE_URL
TEST_SUPABASE_URL
TEST_SUPABASE_PUBLISHABLE_KEY
TEST_OWNER_EMAIL
TEST_OWNER_PASSWORD
TEST_OUTSIDER_EMAIL
TEST_OUTSIDER_PASSWORD
INTEGRATION_TEST_CONFIRMATION=NON_PRODUCTION_DATABASE_CONFIRMED
```

`TEST_DATABASE_URL` must not equal `DATABASE_URL` or `DIRECT_URL`. Both test users must already exist in the disposable Supabase project and have synchronized `profiles` rows.

Apply the authoritative Prisma migrations to the disposable database, then run:

```bash
pnpm test:integration
```

Missing configuration is a failure, not a skipped test.
