import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "../server/app.js";
import connectDB from "../server/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../server/.env") });
dotenv.config();

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection error:", err);
  }
  return app(req, res);
}
