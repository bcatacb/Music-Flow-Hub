import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/projects", async (req, res) => {
  try {
    const projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
    res.json(projects);
  } catch (err) {
    req.log.error({ err }, "Failed to list projects");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects", async (req, res) => {
  try {
    const { name, description, genre, status, coverImageUrl } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const [project] = await db
      .insert(projectsTable)
      .values({ name, description, genre, status: status || "planning", coverImageUrl })
      .returning();
    res.status(201).json(project);
  } catch (err) {
    req.log.error({ err }, "Failed to create project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/projects/:projectId", async (req, res) => {
  try {
    const id = parseInt(req.params.projectId);
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  } catch (err) {
    req.log.error({ err }, "Failed to get project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/projects/:projectId", async (req, res) => {
  try {
    const id = parseInt(req.params.projectId);
    const { name, description, genre, status, coverImageUrl } = req.body;
    const [project] = await db
      .update(projectsTable)
      .set({ name, description, genre, status, coverImageUrl, updatedAt: new Date() })
      .where(eq(projectsTable.id, id))
      .returning();
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  } catch (err) {
    req.log.error({ err }, "Failed to update project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/projects/:projectId", async (req, res) => {
  try {
    const id = parseInt(req.params.projectId);
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete project");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
