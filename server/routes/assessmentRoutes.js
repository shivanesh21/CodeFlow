import express from "express";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import {
  listAssessments,
  getAssessment,
  startAssessment,
  submitAssessment,
  getMyAttempts,
  getAttemptDetail,
} from "../controllers/assessmentController.js";

const router = express.Router();

// Public (but enriched for logged-in users)
router.get("/", optionalProtect, listAssessments);
router.get("/attempts/mine", protect, getMyAttempts);
router.get("/attempts/:attemptId", protect, getAttemptDetail);
router.get("/:id", optionalProtect, getAssessment);

// Protected
router.post("/:id/start", protect, startAssessment);
router.post("/:id/submit", protect, submitAssessment);

console.log("Assessment Routes Loaded");

export default router;
