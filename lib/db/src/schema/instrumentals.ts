import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const licenseTypeEnum = pgEnum("license_type", [
  "exclusive",
  "non_exclusive",
  "lease",
  "free",
]);

export const instrumentalStatusEnum = pgEnum("instrumental_status", [
  "available",
  "in_use",
  "archived",
]);

export const instrumentalsTable = pgTable("instrumentals", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  producer: text("producer"),
  bpm: integer("bpm"),
  musicalKey: text("musical_key"),
  genre: text("genre"),
  mood: text("mood"),
  durationSeconds: integer("duration_seconds"),
  fileUrl: text("file_url"),
  licenseType: licenseTypeEnum("license_type"),
  status: instrumentalStatusEnum("status").notNull().default("available"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInstrumentalSchema = createInsertSchema(instrumentalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInstrumental = z.infer<typeof insertInstrumentalSchema>;
export type Instrumental = typeof instrumentalsTable.$inferSelect;
