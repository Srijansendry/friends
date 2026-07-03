import { defineConfig } from "drizzle-kit";
import path from "path";

const dbPath = process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgres")
  ? process.env.DATABASE_URL
  : path.resolve(__dirname, "../../sqlite.db");

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
