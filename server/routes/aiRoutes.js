import express from "express";
import { chat, analyzePerformance } from "../controllers/aiController.js";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/ai/chat — unified AI endpoint (works for guests and authenticated users)
router.post("/chat", optionalProtect, chat);

// POST /api/ai/analyze-performance — requires auth, returns Gemini learning recommendations
router.post("/analyze-performance", protect, analyzePerformance);

export default router;
