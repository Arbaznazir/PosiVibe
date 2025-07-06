import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function getUserIds() {
  try {
    await mongoose.connect(
      process.env.MONGO_URL ||
        "mongodb+srv://wizkhalifa:Nt6VwYJLRWHVZqyy@cluster0.6cnlm.mongodb.net/social?retryWrites=true&w=majority&appName=Cluster0"
    );

    const users = await User.find({}, "name email _id").limit(5);
    console.log("Users in database:");
    users.forEach((user) => {
      console.log(`${user.name} (${user.email}): ${user._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

getUserIds();
