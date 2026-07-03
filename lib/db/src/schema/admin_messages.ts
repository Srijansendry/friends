import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { connectionRequestsTable } from "./connection_requests";
import { sql } from "drizzle-orm";

export const adminMessagesTable = sqliteTable("admin_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  connectionRequestId: integer("connection_request_id")
    .notNull()
    .references(() => connectionRequestsTable.id),
  toParty: text("to_party").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`)
    .$defaultFn(() => new Date()),
});

export const insertAdminMessageSchema = createInsertSchema(
  adminMessagesTable,
).omit({ id: true, createdAt: true });
export type InsertAdminMessage = z.infer<typeof insertAdminMessageSchema>;
export type AdminMessage = typeof adminMessagesTable.$inferSelect;
