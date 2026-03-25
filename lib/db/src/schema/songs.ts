import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";
import { lyricsTable } from "./lyrics";
import { instrumentalsTable } from "./instrumentals";

export const songStatusEnum = pgEnum("song_status", [
  "idea",
  "writing",
  "recording",
  "mixing",
  "mastering",
  "ready",
  "released",
]);

export const songsTable = pgTable("songs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
  lyricId: integer("lyric_id").references(() => lyricsTable.id, { onDelete: "set null" }),
  instrumentalId: integer("instrumental_id").references(() => instrumentalsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  artistName: text("artist_name"),
  featuredArtists: text("featured_artists"),
  genre: text("genre"),
  mood: text("mood"),
  bpm: integer("bpm"),
  musicalKey: text("musical_key"),
  durationSeconds: integer("duration_seconds"),
  isrc: text("isrc"),
  upc: text("upc"),
  copyright: text("copyright"),
  recordLabel: text("record_label"),
  status: songStatusEnum("status").notNull().default("idea"),
  coverImageUrl: text("cover_image_url"),
  fileUrl: text("file_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSongSchema = createInsertSchema(songsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songsTable.$inferSelect;
