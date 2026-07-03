import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  ownerToken: text("owner_token").notNull(),
  category: text("category").notNull(),
  alias: text("alias").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skills: text("skills").array().notNull().default([]),
  status: text("status").notNull().default("active"),
  viewCount: integer("view_count").notNull().default(0),
  requestCount: integer("request_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
