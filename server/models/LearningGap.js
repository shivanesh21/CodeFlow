import mongoose from "mongoose";
import { ALL_CONCEPTS } from "../utils/concepts.js";

// ============================================================
// LearningGap Model
// Stores detected learning gaps, weak concepts, and repeated mistakes.
// ============================================================

const learningGapSchema = new mongoose.Schema(
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

    severity: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      required: true,
      default: "MEDIUM",
    },

    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    attemptCount: {
      type: Number,
      default: 0,
    },

    recommendedAction: {
      type: String,
      required: true,
      trim: true,
    },

    detectedAt: {
      type: Date,
      default: Date.now,
    },

    // Whether student has revised and fixed this gap
    resolved: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
learningGapSchema.index({ userId: 1, concept: 1 });
learningGapSchema.index({ userId: 1, severity: 1, resolved: 1 });

const LearningGap = mongoose.model("LearningGap", learningGapSchema);

export default LearningGap;
