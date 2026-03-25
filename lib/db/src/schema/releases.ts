import { pgTable, text, serial, timestamp, integer, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const releaseTypeEnum = pgEnum("release_type", [
  "single",
  "ep",
  "album",
  "mixtape",
]);

export const releaseStatusEnum = pgEnum("release_status", [
  "planning",
  "pre_release",
  "released",
  "cancelled",
]);

export const releasesTable = pgTable("releases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  releaseType: releaseTypeEnum("release_type").notNull().default("single"),
  status: releaseStatusEnum("status").notNull().default("planning"),
  releaseDate: date("release_date"),
  platforms: text("platforms"),
  distributorName: text("distributor_name"),
  upc: text("upc"),
  coverImageUrl: text("cover_image_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReleaseSchema = createInsertSchema(releasesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRelease = z.infer<typeof insertReleaseSchema>;
export type Release = typeof releasesTable.$inferSelect;
