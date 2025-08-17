import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    console.log("🔄 Connecting to MongoDB Atlas...");
    
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI environment variable is not defined");
      console.warn("⚠️ Starting app without MongoDB connection. Some features will be limited.");
      return null;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
      socketTimeoutMS: 45000, // 45 seconds timeout for socket operations
      connectTimeoutMS: 30000, // 30 seconds timeout for initial connection
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.warn("⚠️ Starting app without MongoDB connection. Some features will be limited.");
    // Don't exit the process, allow the app to start without DB
    return null;
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("🟢 Mongoose connected to MongoDB Atlas");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🟡 Mongoose disconnected from MongoDB Atlas");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🔴 MongoDB connection closed through app termination");
  process.exit(0);
});

export default connectDB;
