import express from "express";

import {
  createSnippet,
  getAllSnippets,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
  searchSnippets,
  dashboardStats,
} 

from "../controllers/CodeSnippetController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes below require login
router.use(protect);

// Dashboard
router.get("/dashboard", dashboardStats);

// Search
router.get("/search", searchSnippets);

// CRUD
router.post("/", createSnippet);
router.get("/", getAllSnippets);
router.get("/:id", getSnippetById);
router.put("/:id", updateSnippet);
router.delete("/:id", deleteSnippet);

export default router;