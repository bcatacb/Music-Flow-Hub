import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { songsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/songs", async (req, res) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
    const songs = projectId
      ? await db.select().from(songsTable).where(eq(songsTable.projectId, projectId)).orderBy(songsTable.createdAt)
      : await db.select().from(songsTable).orderBy(songsTable.createdAt);
    res.json(songs);
  } catch (err) {
    req.log.error({ err }, "Failed to list songs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/songs", async (req, res) => {
  try {
    const { projectId, lyricId, instrumentalId, title, artistName, featuredArtists, genre, mood, bpm, musicalKey, durationSeconds, isrc, upc, copyright, recordLabel, status, coverImageUrl, fileUrl, notes } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    const [song] = await db
      .insert(songsTable)
      .values({ projectId, lyricId, instrumentalId, title, artistName, featuredArtists, genre, mood, bpm, musicalKey, durationSeconds, isrc, upc, copyright, recordLabel, status: status || "idea", coverImageUrl, fileUrl, notes })
      .returning();
    res.status(201).json(song);
  } catch (err) {
    req.log.error({ err }, "Failed to create song");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/songs/:songId", async (req, res) => {
  try {
    const id = parseInt(req.params.songId);
    const [song] = await db.select().from(songsTable).where(eq(songsTable.id, id));
    if (!song) return res.status(404).json({ error: "Not found" });
    res.json(song);
  } catch (err) {
    req.log.error({ err }, "Failed to get song");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/songs/:songId", async (req, res) => {
  try {
    const id = parseInt(req.params.songId);
    const { projectId, lyricId, instrumentalId, title, artistName, featuredArtists, genre, mood, bpm, musicalKey, durationSeconds, isrc, upc, copyright, recordLabel, status, coverImageUrl, fileUrl, notes } = req.body;
    const [song] = await db
      .update(songsTable)
      .set({ projectId, lyricId, instrumentalId, title, artistName, featuredArtists, genre, mood, bpm, musicalKey, durationSeconds, isrc, upc, copyright, recordLabel, status, coverImageUrl, fileUrl, notes, updatedAt: new Date() })
      .where(eq(songsTable.id, id))
      .returning();
    if (!song) return res.status(404).json({ error: "Not found" });
    res.json(song);
  } catch (err) {
    req.log.error({ err }, "Failed to update song");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/songs/:songId", async (req, res) => {
  try {
    const id = parseInt(req.params.songId);
    await db.delete(songsTable).where(eq(songsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete song");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
