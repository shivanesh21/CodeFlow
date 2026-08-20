import mongoose from "mongoose";

// ============================================================
// Assessment Model
// ============================================================

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assessment title is required"],
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    programmingLanguage: {
      type: String,
      enum: ["python", "javascript", "java", "cpp", "c", "general"],
      default: "general",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      default: "mixed",
    },

    topics: {
      type: [String],
      default: [],
    },

    // Concepts covered in this assessment (aggregated from questions)
    concepts: {
      type: [String],
      default: [],
    },

    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    totalMarks: {
      type: Number,
      default: 0,
    },

    // Time limit in minutes (0 = no limit)
    timeLimit: {
      type: Number,
      default: 30,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Optional: which user created it (null = system/seeded)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Thumbnail / icon identifier for UI
    icon: {
      type: String,
      default: "📝",
    },

    // Tags for filtering on the UI
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

assessmentSchema.index({ isActive: 1, programmingLanguage: 1, difficulty: 1 });

const Assessment = mongoose.model("Assessment", assessmentSchema);

export default Assessment;
