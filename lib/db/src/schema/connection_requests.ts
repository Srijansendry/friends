import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { postsTable } from "./posts";
import { sql } from "drizzle-orm";

export const connectionRequestsTable = sqliteTable(
  "connection_requests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id")
      .notNull()
      .references(() => postsTable.id),
    requesterToken: text("requester_token").notNull(),
    message: text("message").notNull(),
    contactNote: text("contact_note"),
    status: text("status").notNull().default("pending"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`)
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("connection_requests_post_requester_uidx").on(
      table.postId,
      table.requesterToken,
    ),
  ],
);

export const insertConnectionRequestSchema = createInsertSchema(
  connectionRequestsTable,
).omit({ id: true, createdAt: true });
export type InsertConnectionRequest = z.infer<
  typeof insertConnectionRequestSchema
>;
export type ConnectionRequest = typeof connectionRequestsTable.$inferSelect;
