import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { stemsTable, insertStemSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// ─── List all stems (optionally filtered by songId) ────────────────────────
router.get("/stems", async (req, res) => {
  try {
    const songId = req.query.songId ? parseInt(req.query.songId as string) : undefined;
    let rows;
    if (songId) {
      rows = await db.select().from(stemsTable).where(eq(stemsTable.songId, songId));
    } else {
      rows = await db.select().from(stemsTable);
    }
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch stems" });
  }
});

// ─── Get single stem ────────────────────────────────────────────────────────
router.get("/stems/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [stem] = await db.select().from(stemsTable).where(eq(stemsTable.id, id));
    if (!stem) return res.status(404).json({ error: "Stem not found" });
    res.json(stem);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch stem" });
  }
});

// ─── Create stem ────────────────────────────────────────────────────────────
router.post("/stems", async (req, res) => {
  try {
    const parsed = insertStemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const [stem] = await db.insert(stemsTable).values(parsed.data).returning();
    res.status(201).json(stem);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create stem" });
  }
});

// ─── Update stem ────────────────────────────────────────────────────────────
router.patch("/stems/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = insertStemSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const [stem] = await db
      .update(stemsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(stemsTable.id, id))
      .returning();
    if (!stem) return res.status(404).json({ error: "Stem not found" });
    res.json(stem);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update stem" });
  }
});

// ─── Delete stem ────────────────────────────────────────────────────────────
router.delete("/stems/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(stemsTable).where(eq(stemsTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Stem not found" });
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete stem" });
  }
});

export default router;
