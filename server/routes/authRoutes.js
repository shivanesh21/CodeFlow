import express from "express";

import {
  registerUser,
  loginUser,
  getMe,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// Public Routes
// ==============================

// Register User
router.post("/register", registerUser);

// Login User
router.post("/login", loginUser);

// ==============================
// Protected Routes
// ==============================

// Get Logged-in User Profile
router.get("/me", protect, getMe);
console.log("✅ Auth Routes Loaded");

export default router;