import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const lyricStatusEnum = pgEnum("lyric_status", [
  "draft",
  "in_progress",
  "complete",
]);

export const lyricsTable = pgTable("lyrics", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  mood: text("mood"),
  theme: text("theme"),
  language: text("language"),
  status: lyricStatusEnum("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLyricSchema = createInsertSchema(lyricsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLyric = z.infer<typeof insertLyricSchema>;
export type Lyric = typeof lyricsTable.$inferSelect;
