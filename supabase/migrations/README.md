# Migration ownership

Prisma is the sole authoritative migration system for Splitly. Run application migrations from `prisma/migrations/` with `pnpm db:deploy` using `DIRECT_URL`.

The former Supabase migration files were retired after their complete table, RLS, function, and invitation behavior was captured by `prisma/migrations/20260904090000_baseline/migration.sql`. Their original contents remain recoverable from Git history.

Do not add application schema migrations here. Supabase-specific SQL—including RLS, grants, triggers, and functions—belongs in the ordered Prisma migration chain.
