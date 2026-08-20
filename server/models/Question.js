import mongoose from "mongoose";
import { ALL_CONCEPTS } from "../utils/concepts.js";

// ============================================================
// Question Model
// ============================================================

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },

    questionType: {
      type: String,
      enum: ["MCQ", "OutputPrediction", "CodeBased", "Debugging", "Concept"],
      required: [true, "Question type is required"],
      default: "MCQ",
    },

    // For MCQ / OutputPrediction / Debugging
    options: {
      type: [String],
      default: [],
    },

    correctAnswer: {
      type: String,
      required: [true, "Correct answer is required"],
    },

    explanation: {
      type: String,
      default: "",
      trim: true,
    },

    // Code snippet shown to the student (for CodeBased / Debugging / OutputPrediction)
    codeSnippet: {
      type: String,
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    // One or more concepts this question tests (from the taxonomy)
    concepts: {
      type: [String],
      enum: ALL_CONCEPTS,
      required: [true, "At least one concept is required"],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one concept must be provided",
      },
    },

    topic: {
      type: String,
      trim: true,
      default: "",
    },

    programmingLanguage: {
      type: String,
      enum: [
        "python",
        "javascript",
        "java",
        "cpp",
        "c",
        "general",
      ],
      default: "general",
    },

    marks: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },

    // Admin-only flag to hide questions without deleting
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
questionSchema.index({ concepts: 1 });
questionSchema.index({ programmingLanguage: 1, difficulty: 1 });

const Question = mongoose.model("Question", questionSchema);

export default Question;
