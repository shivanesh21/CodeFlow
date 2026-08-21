import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { autoSeedAssessments } from "./utils/seedAssessments.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

connectDB()
  .then(() => autoSeedAssessments())
  .catch((err) => {
    console.error("Database connection error:", err);
  });

