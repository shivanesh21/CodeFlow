import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dns from "dns";

// Fix Node.js SRV DNS lookup issues (querySrv ECONNREFUSED) for MongoDB Atlas
try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (_) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent data directory on disk — data survives server restarts
const DATA_DIR = path.resolve(__dirname, "../../.mongo_data");

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`📁 Created MongoDB data directory: ${DATA_DIR}`);
  }
};

let mongoServer;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // --- Option 0: Connect to MONGO_URI from environment variable if provided ---
  if (process.env.MONGO_URI) {
    try {
      console.log(`🔌 Connecting to MongoDB from environment variable...`);
      await mongoose.connect(process.env.MONGO_URI);
      console.log(`✅ Connected to MongoDB: ${mongoose.connection.host}`);
      return;
    } catch (error) {
      console.warn(`⚠️ Failed to connect to MONGO_URI: ${error.message}`);
    }
  }

  // --- Option 1: Connect to real local MongoDB if available ---
  const REAL_URI = "mongodb://127.0.0.1:27017/codeflow";

  try {
    console.log(`🔌 Trying local MongoDB at 127.0.0.1:27017...`);
    await mongoose.connect(REAL_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    const host = mongoose.connection.host;
    console.log(`✅ Connected to local MongoDB: ${host}/codeflow`);
    console.log(`💡 MongoDB Compass URI: ${REAL_URI}`);
    return;
  } catch (_) {
    console.warn(`⚠️  Local MongoDB not running. Using embedded persistent MongoDB...`);
    try {
      await mongoose.disconnect();
    } catch (_2) {}
  }

  // --- Option 2: Embedded MongoDB on fixed port 27018 with disk persistence ---
  try {
    ensureDataDir();

    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27018,              // Fixed port so Compass always connects at same address
        dbName: "codeflow",
        dbPath: DATA_DIR,         // Persist to disk so data survives restarts
        storageEngine: "wiredTiger",
      },
    });

    const uri = mongoServer.getUri("codeflow");
    await mongoose.connect(uri);

    console.log(`✅ Embedded MongoDB (persistent) running on port 27018`);
    console.log(`📂 Data stored at: ${DATA_DIR}`);
    console.log(`\n💡 MongoDB Compass Connection String:`);
    console.log(`   mongodb://127.0.0.1:27018/codeflow\n`);
  } catch (error) {
    // If port 27018 is busy or dbPath conflicts, try without dbPath
    console.warn("⚠️  Persistent DB failed, trying ephemeral fallback:", error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}

    mongoServer = await MongoMemoryServer.create({
      instance: { port: 27018, dbName: "codeflow" },
    });

    const uri = mongoServer.getUri("codeflow");
    await mongoose.connect(uri);

    console.log(`⚡ Embedded MongoDB (ephemeral) running on port 27018`);
    console.warn(`⚠️  Data will NOT persist across server restarts.`);
    console.log(`💡 MongoDB Compass URI: mongodb://127.0.0.1:27018/codeflow`);
  }
};

export default connectDB;
