import express from "express";

import {
  executeCode,
  getExecutionHistory,
  getExecutionById,
  deleteExecution,
} from "../controllers/executionController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All execution routes require authentication
router.use(protect);

// Execute Code
router.post("/", executeCode);

// Execution History
router.get("/history", getExecutionHistory);

// Single Execution
router.get("/:id", getExecutionById);

// Delete Execution
router.delete("/:id", deleteExecution);

export default router;