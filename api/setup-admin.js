import bcrypt from "bcryptjs";
import User from "./models/User.js";
import connectDB from "./config/database.js";

const setupAdmin = async () => {
  try {
    await connectDB();

    // Admin credentials
    const adminCredentials = {
      username: "admin",
      email: "admin@posivibe.com",
      password: "Admin123!",
      name: "PosiVibe Admin",
      city: "Digital World",
      website: "https://posivibe.com",
      profilePic: "/logo.png",
      coverPic: "/logo.png",
      isAdmin: true,
      isVerified: true,
      verificationBadge: "owner",
      verificationReason: "Platform Owner",
      verifiedBy: "system",
      verificationDate: new Date(),
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { username: adminCredentials.username },
        { email: adminCredentials.email },
      ],
    });

    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Admin Login Details:");
      console.log("Username: admin");
      console.log("Email: admin@posivibe.com");
      console.log("Password: Admin123!");
      console.log("Admin Panel: http://localhost:3000/admin");
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminCredentials.password, salt);

    // Create admin user
    const admin = new User({
      ...adminCredentials,
      password: hashedPassword,
    });

    await admin.save();

    console.log("✅ Admin user created successfully!");
    console.log("================================");
    console.log("🔐 ADMIN LOGIN CREDENTIALS:");
    console.log("Username: admin");
    console.log("Email: admin@posivibe.com");
    console.log("Password: Admin123!");
    console.log("Admin Panel: http://localhost:3000/admin");
    console.log("================================");
    console.log("🏆 Admin has OWNER badge with gold styling");
    console.log("🔧 Admin has full platform privileges");
  } catch (error) {
    console.error("Error setting up admin:", error);
  } finally {
    process.exit(0);
  }
};

setupAdmin();
