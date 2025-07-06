// PosiVibe Database Seeder
// Seeds the database with initial data for development and testing

import dotenv from "dotenv";
dotenv.config();

import { mongoose } from "./connect.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import Comment from "./models/Comment.js";
import Like from "./models/Like.js";
import Relationship from "./models/Relationship.js";
import Story from "./models/Story.js";
import Notification from "./models/Notification.js";
import UserTimeLimit from "./models/UserTimeLimit.js";
import bcrypt from "bcryptjs";

// Sample users data
const sampleUsers = [
  {
    username: "admin",
    email: "admin@posivibe.com",
    password: "admin123",
    name: "PosiVibe Admin",
    profilePic:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    coverPic:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop",
    city: "San Francisco",
    website: "https://posivibe.com",
    isAdmin: true,
  },
  {
    username: "jamsheed",
    email: "jamsheed@example.com",
    password: "password123",
    name: "Jamsheed Khan",
    profilePic:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    coverPic:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=300&fit=crop",
    city: "Karachi",
    website: "https://jamsheed.dev",
  },
  {
    username: "danish",
    email: "danish@example.com",
    password: "password123",
    name: "Danish Ahmed",
    profilePic:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    coverPic:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=300&fit=crop",
    city: "Lahore",
    website: "https://danish.com",
  },
  {
    username: "ahmed_ali",
    email: "ahmed@example.com",
    password: "password123",
    name: "Ahmed Ali",
    profilePic:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
    coverPic:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=300&fit=crop",
    city: "Islamabad",
    website: "https://ahmedali.io",
  },
  {
    username: "fatima_shah",
    email: "fatima@example.com",
    password: "password123",
    name: "Fatima Shah",
    profilePic:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    coverPic:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop",
    city: "Peshawar",
    website: "https://fatima.blog",
  },
  {
    username: "hassan_malik",
    email: "hassan@example.com",
    password: "password123",
    name: "Hassan Malik",
    profilePic:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    coverPic:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop",
    city: "Multan",
    website: "https://hassan.tech",
  },
  {
    username: "sara_khan",
    email: "sara@example.com",
    password: "password123",
    name: "Sara Khan",
    profilePic:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    coverPic:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=300&fit=crop",
    city: "Faisalabad",
    website: "https://sara.dev",
  },
  {
    username: "usman_tariq",
    email: "usman@example.com",
    password: "password123",
    name: "Usman Tariq",
    profilePic:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    coverPic:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=300&fit=crop",
    city: "Rawalpindi",
    website: "https://usman.com",
  },
];

// Sample posts data
const samplePosts = [
  {
    desc: "Welcome to PosiVibe! 🌟 Let's create a positive social media experience together. Share your thoughts, connect with friends, and spread positivity! #PosiVibe #PositiveVibes",
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop",
  },
  {
    desc: "Beautiful sunset from my hiking trip today! 🌅 Nature always reminds us of the beauty in simple moments. #sunset #hiking #nature #gratitude",
    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
  },
  {
    desc: "Just finished reading an amazing book on personal development! 📚 The power of positive thinking can truly transform your life. What book has inspired you lately?",
    img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop",
  },
  {
    desc: "Coffee and coding session ☕💻 Working on some exciting new features for our platform. Technology has the power to bring people together! #coding #coffee #tech",
    img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop",
  },
  {
    desc: "Grateful for all the wonderful people in my life! 🙏 Sometimes it's the small moments with friends and family that matter the most. #gratitude #family #friends",
    img: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop",
  },
  {
    desc: "Amazing food at the local restaurant today! 🍽️ Supporting local businesses is so important for our community. #food #local #community",
    img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop",
  },
  {
    desc: "Workout completed! 💪 Staying healthy and active is the key to happiness. What's your favorite way to stay fit? #fitness #health #workout",
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
  },
  {
    desc: "Learning new skills every day! 🎓 Education is the most powerful tool for personal growth. Never stop learning! #education #growth #learning",
    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop",
  },
  {
    desc: "Music has the power to heal souls 🎵 Just finished an amazing concert. Art brings people together across all boundaries! #music #art #unity",
    img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop",
  },
  {
    desc: "Volunteering at the local shelter today 🤝 Giving back to the community feels amazing. Small acts of kindness can make a big difference! #volunteer #kindness #community",
    img: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop",
  },
];

// Sample stories data
const sampleStories = [
  {
    type: "image",
    media:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop",
  },
  {
    type: "image",
    media:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=700&fit=crop",
  },
  {
    type: "image",
    media:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=700&fit=crop",
  },
];

// Hash password function
const hashPassword = async (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

// Clear existing data
const clearDatabase = async () => {
  try {
    console.log("🗑️ Clearing existing data...");

    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Like.deleteMany({}),
      Relationship.deleteMany({}),
      Story.deleteMany({}),
      Notification.deleteMany({}),
      UserTimeLimit.deleteMany({}),
    ]);

    console.log("✅ Database cleared successfully");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    throw error;
  }
};

// Seed users
const seedUsers = async () => {
  try {
    console.log("👥 Seeding users...");

    const users = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await hashPassword(userData.password);
      const user = new User({
        ...userData,
        password: hashedPassword,
      });
      users.push(await user.save());
    }

    console.log(`✅ Created ${users.length} users`);
    return users;
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
};

// Seed posts
const seedPosts = async (users) => {
  try {
    console.log("📝 Seeding posts...");

    const posts = [];
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      const randomUser = users[i % users.length];

      const post = new Post({
        desc: postData.desc,
        img: postData.img,
        userId: randomUser._id,
      });
      posts.push(await post.save());
    }

    console.log(`✅ Created ${posts.length} posts`);
    return posts;
  } catch (error) {
    console.error("❌ Error seeding posts:", error);
    throw error;
  }
};

// Seed stories
const seedStories = async (users) => {
  try {
    console.log("📖 Seeding stories...");

    const stories = [];
    for (let i = 0; i < sampleStories.length && i < users.length; i++) {
      const storyData = sampleStories[i];
      const user = users[i + 1]; // Skip admin user

      if (user) {
        const story = new Story({
          type: storyData.type,
          media: storyData.media,
          userId: user._id,
        });
        stories.push(await story.save());
      }
    }

    console.log(`✅ Created ${stories.length} stories`);
    return stories;
  } catch (error) {
    console.error("❌ Error seeding stories:", error);
    throw error;
  }
};

// Seed relationships (follows)
const seedRelationships = async (users) => {
  try {
    console.log("🤝 Seeding relationships...");

    const relationships = [];

    // Create some follow relationships
    for (let i = 1; i < users.length; i++) {
      for (let j = 1; j < users.length; j++) {
        if (i !== j && Math.random() > 0.5) {
          const relationship = new Relationship({
            followerUserId: users[i]._id,
            followedUserId: users[j]._id,
          });
          relationships.push(await relationship.save());
        }
      }
    }

    console.log(`✅ Created ${relationships.length} relationships`);
    return relationships;
  } catch (error) {
    console.error("❌ Error seeding relationships:", error);
    throw error;
  }
};

// Seed likes and comments
const seedInteractions = async (users, posts) => {
  try {
    console.log("❤️ Seeding likes and comments...");

    const likes = [];
    const comments = [];

    for (const post of posts) {
      // Add random likes (prevent duplicates)
      const numLikes = Math.floor(Math.random() * users.length);
      const usersWhoLiked = new Set();

      for (let i = 0; i < numLikes; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const userKey = randomUser._id.toString();

        // Skip if user already liked this post
        if (usersWhoLiked.has(userKey)) continue;

        usersWhoLiked.add(userKey);
        const like = new Like({
          userId: randomUser._id,
          postId: post._id,
        });
        likes.push(await like.save());
      }

      // Add random comments
      const numComments = Math.floor(Math.random() * 3) + 1;
      const commentTexts = [
        "Great post! 👍",
        "Love this! ❤️",
        "Thanks for sharing!",
        "Amazing content! 🌟",
        "So inspiring! 💫",
        "Beautiful! 😍",
        "This made my day! 😊",
      ];

      for (let i = 0; i < numComments; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomComment =
          commentTexts[Math.floor(Math.random() * commentTexts.length)];

        const comment = new Comment({
          desc: randomComment,
          userId: randomUser._id,
          postId: post._id,
        });
        comments.push(await comment.save());
      }
    }

    console.log(
      `✅ Created ${likes.length} likes and ${comments.length} comments`
    );
    return { likes, comments };
  } catch (error) {
    console.error("❌ Error seeding interactions:", error);
    throw error;
  }
};

// Seed time limits
const seedTimeLimits = async (users) => {
  try {
    console.log("⏰ Seeding time limits...");

    const timeLimits = [];

    for (const user of users) {
      const timeLimit = new UserTimeLimit({
        userId: user._id,
        dailyLimit: 2.5 * 60 * 60 * 1000, // 2.5 hours in milliseconds
        usedTime: Math.floor(Math.random() * 60 * 60 * 1000), // Random used time
        lastReset: new Date(),
      });
      timeLimits.push(await timeLimit.save());
    }

    console.log(`✅ Created ${timeLimits.length} time limit records`);
    return timeLimits;
  } catch (error) {
    console.error("❌ Error seeding time limits:", error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");
    console.log("=".repeat(50));

    // Wait for database connection
    if (mongoose.connection.readyState !== 1) {
      console.log("⏳ Waiting for database connection...");
      await new Promise((resolve) => {
        mongoose.connection.on("connected", resolve);
      });
    }

    // Clear existing data
    await clearDatabase();

    // Seed data in order
    const users = await seedUsers();
    const posts = await seedPosts(users);
    const stories = await seedStories(users);
    const relationships = await seedRelationships(users);
    const { likes, comments } = await seedInteractions(users, posts);
    const timeLimits = await seedTimeLimits(users);

    console.log("=".repeat(50));
    console.log("🎉 Database seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📝 Posts: ${posts.length}`);
    console.log(`   📖 Stories: ${stories.length}`);
    console.log(`   🤝 Relationships: ${relationships.length}`);
    console.log(`   ❤️ Likes: ${likes.length}`);
    console.log(`   💬 Comments: ${comments.length}`);
    console.log(`   ⏰ Time Limits: ${timeLimits.length}`);
    console.log("=".repeat(50));

    // Display login credentials
    console.log("🔐 Test Login Credentials:");
    console.log("   Admin: admin@posivibe.com / admin123");
    console.log("   Jamsheed: jamsheed@example.com / password123");
    console.log("   Danish: danish@example.com / password123");
    console.log("   Ahmed: ahmed@example.com / password123");
    console.log("   Fatima: fatima@example.com / password123");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (process.argv[1].endsWith("seed.js")) {
  seedDatabase()
    .then(() => {
      console.log("✅ Seeding process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding process failed:", error);
      process.exit(1);
    });
}

export default seedDatabase;
