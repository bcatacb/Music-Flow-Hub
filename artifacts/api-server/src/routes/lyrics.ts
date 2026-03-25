import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { lyricsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/lyrics", async (req, res) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
    const query = db.select().from(lyricsTable).orderBy(lyricsTable.createdAt);
    const lyrics = projectId
      ? await db.select().from(lyricsTable).where(eq(lyricsTable.projectId, projectId)).orderBy(lyricsTable.createdAt)
      : await query;
    res.json(lyrics);
  } catch (err) {
    req.log.error({ err }, "Failed to list lyrics");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/lyrics", async (req, res) => {
  try {
    const { projectId, title, content, mood, theme, language, status, notes } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    const [lyric] = await db
      .insert(lyricsTable)
      .values({ projectId, title, content: content || "", mood, theme, language, status: status || "draft", notes })
      .returning();
    res.status(201).json(lyric);
  } catch (err) {
    req.log.error({ err }, "Failed to create lyric");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/lyrics/:lyricId", async (req, res) => {
  try {
    const id = parseInt(req.params.lyricId);
    const [lyric] = await db.select().from(lyricsTable).where(eq(lyricsTable.id, id));
    if (!lyric) return res.status(404).json({ error: "Not found" });
    res.json(lyric);
  } catch (err) {
    req.log.error({ err }, "Failed to get lyric");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/lyrics/:lyricId", async (req, res) => {
  try {
    const id = parseInt(req.params.lyricId);
    const { projectId, title, content, mood, theme, language, status, notes } = req.body;
    const [lyric] = await db
      .update(lyricsTable)
      .set({ projectId, title, content, mood, theme, language, status, notes, updatedAt: new Date() })
      .where(eq(lyricsTable.id, id))
      .returning();
    if (!lyric) return res.status(404).json({ error: "Not found" });
    res.json(lyric);
  } catch (err) {
    req.log.error({ err }, "Failed to update lyric");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/lyrics/:lyricId", async (req, res) => {
  try {
    const id = parseInt(req.params.lyricId);
    await db.delete(lyricsTable).where(eq(lyricsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete lyric");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
