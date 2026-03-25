import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { analyticsTable, songsTable } from "@workspace/db/schema";
import { eq, sum } from "drizzle-orm";

const router: IRouter = Router();

router.get("/analytics", async (req, res) => {
  try {
    const songId = req.query.songId ? parseInt(req.query.songId as string) : undefined;
    const entries = songId
      ? await db.select().from(analyticsTable).where(eq(analyticsTable.songId, songId)).orderBy(analyticsTable.recordedDate)
      : await db.select().from(analyticsTable).orderBy(analyticsTable.recordedDate);
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to list analytics");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/analytics", async (req, res) => {
  try {
    const { songId, platform, streams, downloads, likes, recordedDate } = req.body;
    if (!songId || !platform || !recordedDate) {
      return res.status(400).json({ error: "songId, platform, and recordedDate are required" });
    }
    const [entry] = await db
      .insert(analyticsTable)
      .values({ songId, platform, streams: streams || 0, downloads: downloads || 0, likes: likes || 0, recordedDate })
      .returning();
    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to create analytics entry");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/summary", async (req, res) => {
  try {
    const rows = await db
      .select({
        songId: analyticsTable.songId,
        songTitle: songsTable.title,
        totalStreams: sum(analyticsTable.streams).mapWith(Number),
        totalDownloads: sum(analyticsTable.downloads).mapWith(Number),
        totalLikes: sum(analyticsTable.likes).mapWith(Number),
      })
      .from(analyticsTable)
      .leftJoin(songsTable, eq(analyticsTable.songId, songsTable.id))
      .groupBy(analyticsTable.songId, songsTable.title);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to get analytics summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
