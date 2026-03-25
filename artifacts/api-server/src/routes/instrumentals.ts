import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { instrumentalsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/instrumentals", async (req, res) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
    const instrumentals = projectId
      ? await db.select().from(instrumentalsTable).where(eq(instrumentalsTable.projectId, projectId)).orderBy(instrumentalsTable.createdAt)
      : await db.select().from(instrumentalsTable).orderBy(instrumentalsTable.createdAt);
    res.json(instrumentals);
  } catch (err) {
    req.log.error({ err }, "Failed to list instrumentals");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/instrumentals", async (req, res) => {
  try {
    const { projectId, title, producer, bpm, musicalKey, genre, mood, durationSeconds, fileUrl, licenseType, status, notes } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    const [instrumental] = await db
      .insert(instrumentalsTable)
      .values({ projectId, title, producer, bpm, musicalKey, genre, mood, durationSeconds, fileUrl, licenseType, status: status || "available", notes })
      .returning();
    res.status(201).json(instrumental);
  } catch (err) {
    req.log.error({ err }, "Failed to create instrumental");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/instrumentals/:instrumentalId", async (req, res) => {
  try {
    const id = parseInt(req.params.instrumentalId);
    const [instrumental] = await db.select().from(instrumentalsTable).where(eq(instrumentalsTable.id, id));
    if (!instrumental) return res.status(404).json({ error: "Not found" });
    res.json(instrumental);
  } catch (err) {
    req.log.error({ err }, "Failed to get instrumental");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/instrumentals/:instrumentalId", async (req, res) => {
  try {
    const id = parseInt(req.params.instrumentalId);
    const { projectId, title, producer, bpm, musicalKey, genre, mood, durationSeconds, fileUrl, licenseType, status, notes } = req.body;
    const [instrumental] = await db
      .update(instrumentalsTable)
      .set({ projectId, title, producer, bpm, musicalKey, genre, mood, durationSeconds, fileUrl, licenseType, status, notes, updatedAt: new Date() })
      .where(eq(instrumentalsTable.id, id))
      .returning();
    if (!instrumental) return res.status(404).json({ error: "Not found" });
    res.json(instrumental);
  } catch (err) {
    req.log.error({ err }, "Failed to update instrumental");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/instrumentals/:instrumentalId", async (req, res) => {
  try {
    const id = parseInt(req.params.instrumentalId);
    await db.delete(instrumentalsTable).where(eq(instrumentalsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete instrumental");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
