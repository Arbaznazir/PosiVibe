import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Validate required environment variables
const requiredEnvVars = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing Cloudinary environment variables:", {
    missing: missingEnvVars,
    available: Object.keys(process.env).filter((key) =>
      key.startsWith("CLOUDINARY_")
    ),
  });
  throw new Error(
    `Missing required Cloudinary environment variables: ${missingEnvVars.join(
      ", "
    )}`
  );
}

const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

cloudinary.config(config);

export { cloudinary };
export default config;
