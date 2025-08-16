// fixEnv.js - Environment variable and configuration fixes
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Function to check and fix email configuration
export const checkEmailConfig = () => {
  const emailUser = process.env.EMAIL_VERIFICATION;
  const emailPass = process.env.EMAIL_VERIFICATION_PASSWORD;
  
  if (!emailUser || !emailPass) {
    console.warn('⚠️ Missing email configuration. Using mock email service for development.');
    
    // Set mock email service for development
    process.env.USE_MOCK_EMAIL = 'true';
    return false;
  }
  
  return true;
};

// Function to create a .env file with default values if it doesn't exist
export const ensureEnvFile = () => {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('Creating default .env file...');
    
    const defaultEnv = `
# PosiVibe Environment Configuration
NODE_ENV=development
PORT=8800
MONGO_URL=mongodb://localhost:27017/posivibe
JWT_SECRET=posivibe-secret-key-change-in-production
EMAIL_VERIFICATION=your-email@gmail.com
EMAIL_VERIFICATION_PASSWORD=your-app-password
# Set to true to use mock email service (for development)
USE_MOCK_EMAIL=true
`;
    
    fs.writeFileSync(envPath, defaultEnv.trim());
    console.log('Default .env file created. Please update with your actual values.');
  }
};

// Initialize environment
export const initializeEnvironment = () => {
  ensureEnvFile();
  checkEmailConfig();
};

// Export default function for direct import and execution
export default initializeEnvironment;
