import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { releasesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/releases", async (req, res) => {
  try {
    const releases = await db.select().from(releasesTable).orderBy(releasesTable.createdAt);
    res.json(releases);
  } catch (err) {
    req.log.error({ err }, "Failed to list releases");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/releases", async (req, res) => {
  try {
    const { projectId, title, releaseType, status, releaseDate, platforms, distributorName, upc, coverImageUrl, notes } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    const [release] = await db
      .insert(releasesTable)
      .values({ projectId, title, releaseType: releaseType || "single", status: status || "planning", releaseDate, platforms, distributorName, upc, coverImageUrl, notes })
      .returning();
    res.status(201).json(release);
  } catch (err) {
    req.log.error({ err }, "Failed to create release");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/releases/:releaseId", async (req, res) => {
  try {
    const id = parseInt(req.params.releaseId);
    const [release] = await db.select().from(releasesTable).where(eq(releasesTable.id, id));
    if (!release) return res.status(404).json({ error: "Not found" });
    res.json(release);
  } catch (err) {
    req.log.error({ err }, "Failed to get release");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/releases/:releaseId", async (req, res) => {
  try {
    const id = parseInt(req.params.releaseId);
    const { projectId, title, releaseType, status, releaseDate, platforms, distributorName, upc, coverImageUrl, notes } = req.body;
    const [release] = await db
      .update(releasesTable)
      .set({ projectId, title, releaseType, status, releaseDate, platforms, distributorName, upc, coverImageUrl, notes, updatedAt: new Date() })
      .where(eq(releasesTable.id, id))
      .returning();
    if (!release) return res.status(404).json({ error: "Not found" });
    res.json(release);
  } catch (err) {
    req.log.error({ err }, "Failed to update release");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/releases/:releaseId", async (req, res) => {
  try {
    const id = parseInt(req.params.releaseId);
    await db.delete(releasesTable).where(eq(releasesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete release");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
