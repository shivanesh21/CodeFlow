import mongoose from "mongoose";
import { ALL_CONCEPTS } from "../utils/concepts.js";

// ============================================================
// StudentConceptPerformance Model
// One document per (userId, concept) pair — auto-upserted.
// ============================================================

const studentConceptPerformanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    concept: {
      type: String,
      enum: ALL_CONCEPTS,
      required: true,
    },

    totalAttempts: {
      type: Number,
      default: 0,
    },

    correctAnswers: {
      type: Number,
      default: 0,
    },

    wrongAnswers: {
      type: Number,
      default: 0,
    },

    // Percentage: (correctAnswers / totalAttempts) * 100
    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Average marks scored across attempts (0–100 scale)
    averageScore: {
      type: Number,
      default: 0,
    },

    // Score from the most recent attempt (0–100)
    recentScore: {
      type: Number,
      default: 0,
    },

    masteryLevel: {
      type: String,
      enum: ["Weak", "Developing", "Good", "Mastered", "Novice", "Competent", "Proficient", "Expert"],
      default: "Weak",
    },

    // Performance trend based on last few attempts
    trend: {
      type: String,
      enum: ["improving", "declining", "stable", "insufficient_data"],
      default: "insufficient_data",
    },

    // Scores of last 5 attempts for trend calculation
    recentScores: {
      type: [Number],
      default: [],
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index — one record per student per concept
studentConceptPerformanceSchema.index(
  { userId: 1, concept: 1 },
  { unique: true }
);

// Index for fetching all concepts for a user quickly
studentConceptPerformanceSchema.index({ userId: 1, masteryLevel: 1 });

const StudentConceptPerformance = mongoose.model(
  "StudentConceptPerformance",
  studentConceptPerformanceSchema
);

export default StudentConceptPerformance;
