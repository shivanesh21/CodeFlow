import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import codeSnippetRoutes from "./routes/CodeSnippetRoutes.js";
import executionRoutes from "./routes/executionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import visualizerRoutes from "./routes/visualizerRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to CodeFlow Backend API",
    version: "1.0.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/snippets", codeSnippetRoutes);
app.use("/api/execute", executionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/visualizer", visualizerRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "Running",
    timestamp: new Date(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

export default app;
