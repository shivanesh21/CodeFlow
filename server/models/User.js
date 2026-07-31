import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "https://api.dicebear.com/7.x/bottts/svg?seed=CodeFlowUser",
    },
    bio: {
      type: String,
      default: "Passionate Developer & Problem Solver",
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);