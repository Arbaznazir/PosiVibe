import { mongoose } from "./connect.js";
import User from "./models/User.js";

const checkUsers = async () => {
  try {
    console.log("🔍 Checking users in database...");

    const users = await User.find({}, "name email username");

    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.name} (${user.email}) - @${user.username}`
      );
    });

    if (users.length === 0) {
      console.log("❌ No users found in database!");
      console.log("🔄 Running seed script...");

      // Import and run seed
      const { default: seedDatabase } = await import("./seed.js");
      await seedDatabase();
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkUsers();
