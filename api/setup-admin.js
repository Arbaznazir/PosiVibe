import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

async function setupAdmin() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Atlas");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@posivibe.com" });
    if (existingAdmin) {
      // Update admin privileges if needed
      if (!existingAdmin.isAdmin) {
        await User.updateOne(
          { email: "admin@posivibe.com" },
          { $set: { isAdmin: true } }
        );
        console.log("Updated existing user to admin");
      } else {
        console.log("Admin user already exists");
      }
    } else {
      // Create admin user
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync("admin123", salt);

      const adminUser = new User({
        username: "admin",
        email: "admin@posivibe.com",
        password: hashedPassword,
        name: "PosiVibe Admin",
        isAdmin: true,
      });

      await adminUser.save();
      console.log("Admin user created successfully");
    }

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error setting up admin:", error);
    process.exit(1);
  }
}

setupAdmin();
