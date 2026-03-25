import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { songsTable } from "./songs";

export const stemTypeEnum = pgEnum("stem_type", [
  "drums",
  "bass",
  "vocals",
  "lead_vocals",
  "backing_vocals",
  "guitars",
  "keys",
  "synth",
  "strings",
  "brass",
  "fx",
  "full_mix",
  "instrumental_mix",
  "acapella",
  "other",
]);

export const stemFormatEnum = pgEnum("stem_format", [
  "wav",
  "mp3",
  "aiff",
  "flac",
  "m4a",
  "ogg",
  "other",
]);

export const stemsTable = pgTable("stems", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").references(() => songsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  stemType: stemTypeEnum("stem_type").notNull().default("other"),
  format: stemFormatEnum("format").notNull().default("wav"),
  fileUrl: text("file_url"),
  durationSeconds: integer("duration_seconds"),
  sampleRate: integer("sample_rate"),
  bitDepth: integer("bit_depth"),
  channels: integer("channels"),
  bpm: integer("bpm"),
  musicalKey: text("musical_key"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStemSchema = createInsertSchema(stemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStem = z.infer<typeof insertStemSchema>;
export type Stem = typeof stemsTable.$inferSelect;
