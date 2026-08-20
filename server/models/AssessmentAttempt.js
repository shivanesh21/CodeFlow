import mongoose from "mongoose";

// ============================================================
// AssessmentAttempt Model
// Stores a student's single attempt at an assessment.
// ============================================================

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    // What the student answered (string for all question types)
    selectedAnswer: {
      type: String,
      default: "",
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },

    marksAwarded: {
      type: Number,
      default: 0,
    },

    // The concepts this question tested (copied at attempt time for easy querying)
    concepts: {
      type: [String],
      default: [],
    },

    // Time the student spent on this question (ms)
    timeTakenMs: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },

    answers: [answerSchema],

    totalScore: {
      type: Number,
      default: 0,
    },

    maxScore: {
      type: Number,
      default: 0,
    },

    percentage: {
      type: Number,
      default: 0,
    },

    // Concept-level breakdown: { concept -> { correct, total } }
    conceptBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // Total time taken in ms
    totalTimeTakenMs: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["in-progress", "completed", "timed-out"],
      default: "in-progress",
    },
  },
  {
    timestamps: true,
  }
);

assessmentAttemptSchema.index({ userId: 1, assessmentId: 1 });
assessmentAttemptSchema.index({ userId: 1, status: 1 });

const AssessmentAttempt = mongoose.model(
  "AssessmentAttempt",
  assessmentAttemptSchema
);

export default AssessmentAttempt;
