import mongoose from "mongoose";

const codeSnippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 100,
    },

    language: {
      type: String,
      required: [true, "Programming language is required"],
      enum: [
        "javascript",
        "python",
        "java",
        "c",
        "cpp",
        "typescript",
      ],
    },

    code: {
      type: String,
      required: [true, "Code is required"],
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    tags: {
      type: [String],
      default: [],
    },

    executionCount: {
      type: Number,
      default: 0,
    },

    lastExecutedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const CodeSnippet = mongoose.model("CodeSnippet", codeSnippetSchema);

export default CodeSnippet;