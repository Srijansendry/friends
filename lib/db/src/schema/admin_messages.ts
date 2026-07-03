import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { connectionRequestsTable } from "./connection_requests";

export const adminMessagesTable = pgTable("admin_messages", {
  id: serial("id").primaryKey(),
  connectionRequestId: integer("connection_request_id")
    .notNull()
    .references(() => connectionRequestsTable.id),
  toParty: text("to_party").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertAdminMessageSchema = createInsertSchema(
  adminMessagesTable,
).omit({ id: true, createdAt: true });
export type InsertAdminMessage = z.infer<typeof insertAdminMessageSchema>;
export type AdminMessage = typeof adminMessagesTable.$inferSelect;
