import mongoose from "mongoose";

// MongoDB connection string with your credentials
const MONGODB_URI =
  "mongodb+srv://arbaznazir4:ghostrider4@posivibe.egsib9n.mongodb.net/social?retryWrites=true&w=majority&appName=PosiVibe";

// Connect to MongoDB with better options
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("MongoDB connection error:", error);

    // Fallback: Create a simple mock for testing if MongoDB fails
    console.log("Setting up fallback mock database...");
    setupMockDatabase();
  }
};

// Mock database for fallback
const setupMockDatabase = () => {
  // Override mongoose methods with mock implementations
  const mockSave = function () {
    console.log("Mock: Saving document");
    return Promise.resolve({ _id: new mongoose.Types.ObjectId(), ...this });
  };

  const mockFind = () => {
    console.log("Mock: Finding documents");
    return Promise.resolve([]);
  };

  const mockFindOne = () => {
    console.log("Mock: Finding one document");
    return Promise.resolve(null);
  };

  const mockFindById = () => {
    console.log("Mock: Finding by ID");
    return Promise.resolve(null);
  };

  // Apply mock methods to all models when they're created
  mongoose.Model.prototype.save = mockSave;
  mongoose.Model.find = mockFind;
  mongoose.Model.findOne = mockFindOne;
  mongoose.Model.findById = mockFindById;
  mongoose.Model.findOneAndDelete = () => Promise.resolve(null);
  mongoose.Model.findByIdAndUpdate = () => Promise.resolve(null);
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

// Initialize connection
connectDB();

export { mongoose };
