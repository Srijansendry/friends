import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { postsTable } from "./posts";

export const connectionRequestsTable = pgTable(
  "connection_requests",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => postsTable.id),
    requesterToken: text("requester_token").notNull(),
    message: text("message").notNull(),
    contactNote: text("contact_note"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
