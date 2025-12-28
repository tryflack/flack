// Prisma config for migrations
// Note: Prisma CLI doesn't understand libsql:// URLs, so we use LOCAL_DATABASE_URL
// for migrations when using Turso in production
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use LOCAL_DATABASE_URL for Prisma CLI (migrations), fallback to DATABASE_URL
    url: env("LOCAL_DATABASE_URL") ?? env("DATABASE_URL") ?? "file:./dev.db",
  },
});
