import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import lyricsRouter from "./lyrics";
import instrumentalsRouter from "./instrumentals";
import songsRouter from "./songs";
import releasesRouter from "./releases";
import analyticsRouter from "./analytics";
import importRouter from "./import";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(lyricsRouter);
router.use(instrumentalsRouter);
router.use(songsRouter);
router.use(releasesRouter);
router.use(analyticsRouter);
router.use(importRouter);

export default router;
