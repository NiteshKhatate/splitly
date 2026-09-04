import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI operations use the direct connection. The fallback only lets
    // schema generation run in environments that do not connect to a database.
    url:
      process.env.DIRECT_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/splitly",
  },
});
