import {
  sqliteTable,
  text,
  integer,
  customType,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

const textArray = customType<{ data: string[] }>({
  dataType() {
    return "text";
  },
  toDriver(value: string[]) {
    return JSON.stringify(value);
  },
  fromDriver(value: unknown) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as string[];
      } catch {
        return [];
      }
    }
    return [];
  },
});

export const postsTable = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerToken: text("owner_token").notNull(),
  category: text("category").notNull(),
  alias: text("alias").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skills: textArray("skills").notNull().default([]),
  status: text("status").notNull().default("active"),
  viewCount: integer("view_count").notNull().default(0),
  requestCount: integer("request_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`)
    .$defaultFn(() => new Date()),
  imageUrl: text("image_url"),
  imageUrls: textArray("image_urls").notNull().default([]),
  urgency: text("urgency").notNull().default("casual"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  contactNote: text("contact_note"),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
