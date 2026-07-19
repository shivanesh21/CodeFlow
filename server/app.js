import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import codeSnippetRoutes from "./routes/codeSnippetRoutes.js";

const app = express();

// ===========================================
// Middlewares
// ===========================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ===========================================
// Home Route
// ===========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Welcome to CodeFlow Backend API",
    version: "1.0.0",
  });
});

// ===========================================
// API Routes
// ===========================================

// Authentication Routes
app.use("/api/auth", authRoutes);

// Code Snippet Routes
app.use("/api/snippets", codeSnippetRoutes);

// ===========================================
// Health Check Route
// ===========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "Server Running",
    timestamp: new Date(),
  });
});

// ===========================================
// 404 Route
// ===========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

// ===========================================
// Global Error Handler
// ===========================================

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

export default app;