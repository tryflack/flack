import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";
import fs from "fs";

// Check if using Turso (remote libsql database)
function isTursoUrl(url: string): boolean {
  return url.startsWith("libsql://") || url.startsWith("https://");
}

// Find the database file by checking common locations
function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  // If it's an absolute path or Turso URL, use as-is
  if (envUrl?.startsWith("file:/") || isTursoUrl(envUrl ?? "")) {
    return envUrl!;
  }

  // Check common locations for dev.db
  const cwd = process.cwd();
  const possiblePaths = [
    path.join(cwd, "packages/db/dev.db"), // From project root
    path.join(cwd, "dev.db"), // From packages/db
    path.join(cwd, "../db/dev.db"), // From sibling package
    path.join(cwd, "../../packages/db/dev.db"), // From apps/web
  ];

  for (const dbPath of possiblePaths) {
    if (fs.existsSync(dbPath)) {
      return `file:${dbPath}`;
    }
  }

  // Default fallback - assume we're in packages/db
  return `file:${path.join(cwd, "packages/db/dev.db")}`;
}

const databaseUrl = resolveDatabaseUrl();

// Create the Prisma adapter with optional Turso auth token
const adapter = new PrismaLibSql({
  url: databaseUrl,
  ...(isTursoUrl(databaseUrl) && process.env.DATABASE_AUTH_TOKEN
    ? { authToken: process.env.DATABASE_AUTH_TOKEN }
    : {}),
});

const prisma = new PrismaClient({ adapter });

export default prisma;
