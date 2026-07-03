import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgres")
  ? process.env.DATABASE_URL
  : path.resolve(process.cwd(), "sqlite.db");

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export * from "./schema";
