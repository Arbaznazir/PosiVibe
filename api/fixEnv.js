import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

try {
  console.log('Reading .env file...');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('Fixing environment variable names...');
  // Replace dots with underscores in environment variable names
  const fixedContent = envContent
    .replace(/EMAIL\.VERIFICATION\s*=/g, 'EMAIL_VERIFICATION=')
    .replace(/EMAIL\.VERIFICATION\.PASSWORD\s*=/g, 'EMAIL_VERIFICATION_PASSWORD=');
  
  console.log('Writing fixed .env file...');
  fs.writeFileSync(envPath, fixedContent);
  
  console.log('✅ Environment variables fixed successfully!');
  console.log('Please restart your API server for the changes to take effect.');
} catch (error) {
  console.error('Error fixing environment variables:', error);
}
