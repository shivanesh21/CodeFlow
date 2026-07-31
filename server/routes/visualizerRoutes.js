import express from "express";
import {
  getTraceSnapshots,
  saveVisualizerSession,
  getVisualizerSessions,
} from "../controllers/visualizerController.js";

const router = express.Router();

router.post("/trace", getTraceSnapshots);
router.post("/save", saveVisualizerSession);
router.get("/sessions", getVisualizerSessions);

export default router;
