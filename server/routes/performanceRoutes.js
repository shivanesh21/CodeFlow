import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getConceptPerformance,
  getPerformanceSummary,
  getLearningGaps,
} from "../controllers/performanceController.js";

const router = express.Router();

// All performance routes require authentication
router.get("/concepts", protect, getConceptPerformance);
router.get("/summary", protect, getPerformanceSummary);
router.get("/gaps", protect, getLearningGaps);

console.log("Performance Routes Loaded");

export default router;

