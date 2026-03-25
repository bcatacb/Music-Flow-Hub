import { pgTable, serial, timestamp, integer, text, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { songsTable } from "./songs";

export const analyticsTable = pgTable("analytics", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").notNull().references(() => songsTable.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  streams: integer("streams").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  recordedDate: date("recorded_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnalyticsSchema = createInsertSchema(analyticsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analyticsTable.$inferSelect;
