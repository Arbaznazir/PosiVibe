import User from "./models/User.js";
import connectDB from "./config/database.js";

const checkAdminVerification = async () => {
  try {
    await connectDB();

    // Find the admin user
    const admin = await User.findOne({ username: "admin" });

    if (!admin) {
      console.log("❌ Admin user not found!");
      return;
    }

    console.log("🔍 Admin User Verification Status:");
    console.log("================================");
    console.log("Name:", admin.name);
    console.log("Username:", admin.username);
    console.log("Email:", admin.email);
    console.log("Is Admin:", admin.isAdmin);
    console.log("Is Verified:", admin.isVerified);
    console.log("Verification Badge:", admin.verificationBadge);
    console.log("Verification Reason:", admin.verificationReason);
    console.log("Verified By:", admin.verifiedBy);
    console.log("Verification Date:", admin.verificationDate);
    console.log("================================");

    // Update admin with verification if missing
    if (!admin.isVerified || !admin.verificationBadge) {
      console.log("🔧 Updating admin verification...");

      admin.isVerified = true;
      admin.verificationBadge = "owner";
      admin.verificationReason = "Platform Owner";
      admin.verifiedBy = "system";
      admin.verificationDate = new Date();

      await admin.save();

      console.log("✅ Admin verification updated!");
    } else {
      console.log("✅ Admin verification is properly set!");
    }
  } catch (error) {
    console.error("Error checking admin:", error);
  } finally {
    process.exit(0);
  }
};

checkAdminVerification();
