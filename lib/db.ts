import { PrismaClient } from "@prisma/client";

const globalForDb = globalThis as unknown as {
  db?: PrismaClient;
};

export const db =
  globalForDb.db ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
