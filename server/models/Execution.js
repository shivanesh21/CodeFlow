import mongoose from "mongoose";

const executionSchema = new mongoose.Schema(
  {
    // Logged-in User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Related Code Snippet
    snippet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CodeSnippet",
      default: null,
    },

    // Programming Language
    language: {
      type: String,
      required: true,
      enum: [
        "javascript",
        "python",
        "java",
        "c",
        "cpp",
        "typescript",
      ],
    },

    // Source Code
    code: {
      type: String,
      required: true,
    },

    // Optional User Input
    input: {
      type: String,
      default: "",
    },

    // Console Output
    output: {
      type: String,
      default: "",
    },

    // Error Output
    error: {
      type: String,
      default: "",
    },

    // Success / Error / Timeout
    status: {
      type: String,
      enum: ["success", "error", "timeout"],
      default: "success",
    },

    // Execution Time (ms)
    executionTime: {
      type: Number,
      default: 0,
    },

    // Memory Usage (Future Feature)
    memoryUsed: {
      type: Number,
      default: 0,
    },

    // Exit Code
    exitCode: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
executionSchema.index({ user: 1 });
executionSchema.index({ createdAt: -1 });
executionSchema.index({ language: 1 });
executionSchema.index({ status: 1 });

const Execution = mongoose.model("Execution", executionSchema);

export default Execution;
