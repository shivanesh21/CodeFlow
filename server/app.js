import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import codeSnippetRoutes from "./routes/codeSnippetRoutes.js";
import executionRoutes from "./routes/executionRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Welcome to CodeFlow Backend API",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/snippets", codeSnippetRoutes);
app.use("/api/execute", executionRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "Server Running",
    timestamp: new Date(),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

export default app;
