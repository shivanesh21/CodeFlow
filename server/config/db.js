import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

const getMongoUri = () => {
  const configuredUri = process.env.MONGO_URI?.trim();

  if (!configuredUri || configuredUri.includes("<") || configuredUri === "PORT=5000") {
    return null;
  }

  if (/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(configuredUri)) {
    return null;
  }

  return configuredUri;
};

const connectDB = async () => {
  try {
    let mongoUri = getMongoUri();

    if (!mongoUri) {
      console.warn("⚠️ No reachable MongoDB URI configured. Starting an embedded MongoDB instance for development.");
      mongoServer = await MongoMemoryServer.create({ instance: { dbName: "codeflow" } });
      mongoUri = mongoServer.getUri();
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;