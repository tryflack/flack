import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { env } from 'prisma/config';

const adapter = new PrismaLibSql({
  url: env('TURSO_DATABASE_URL'),
  authToken: env('TURSO_AUTH_TOKEN'),
})

const prisma = new PrismaClient({ adapter });

export default prisma;