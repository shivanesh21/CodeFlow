import express from "express";

import {
  runCode,
  getExecutionHistory,
  getExecutionById,
  deleteExecution,
  clearExecutionHistory,
  getExecutionStats,
} from "../controllers/executionController.js";

import { protect, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Execute Code (Supports saving history for authenticated users or running as guest)
router.post("/", optionalProtect, runCode);

// History
router.get("/history", protect, getExecutionHistory);

// Statistics
router.get("/stats", protect, getExecutionStats);

// Clear All History
router.delete("/history/clear", protect, clearExecutionHistory);

// Single Execution
router.get("/:id", protect, getExecutionById);

// Delete Single Execution
router.delete("/:id", protect, deleteExecution);

export default router;
