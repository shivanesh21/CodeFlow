import mongoose from "mongoose";

const executionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    snippet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CodeSnippet",
      required: false,
    },

    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    code: {
      type: String,
      required: true,
    },

    input: {
      type: String,
      default: "",
    },

    output: {
      type: String,
      default: "",
    },

    error: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["success", "error", "timeout", "compilation_error", "runtime_error"],
      default: "success",
    },

    executionTime: {
      type: Number,
      default: 0,
    },

    memoryUsed: {
      type: Number,
      default: 0,
    },

    exitCode: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Execution", executionSchema);