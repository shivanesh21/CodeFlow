import mongoose from "mongoose";

const visualizerSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    title: {
      type: String,
      required: true,
      default: "Untitled Visualization",
    },
    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      required: true,
      default: "javascript",
    },
    conceptLevel: {
      type: String,
      default: "LEVEL_1",
    },
    conceptName: {
      type: String,
      default: "Variable Declarations",
    },
    code: {
      type: String,
      required: true,
    },
    totalSteps: {
      type: Number,
      default: 0,
    },
    snapshots: [
      {
        stepIndex: Number,
        currentLine: Number,
        lineCode: String,
        explanation: String,
        conceptType: String,
        variables: mongoose.Schema.Types.Mixed,
        objects: mongoose.Schema.Types.Mixed,
        arrays: mongoose.Schema.Types.Mixed,
        callStack: mongoose.Schema.Types.Mixed,
        heap: mongoose.Schema.Types.Mixed,
        pointers: mongoose.Schema.Types.Mixed,
        consoleOutput: [String],
        executionTimeMs: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const VisualizerSession = mongoose.model("VisualizerSession", visualizerSessionSchema);

export default VisualizerSession;
