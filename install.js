const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting dependency installation...');

// Install root dependencies
console.log('Installing root dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Install API dependencies
console.log('Installing API dependencies...');
const apiDir = path.join(__dirname, 'api');
process.chdir(apiDir);
execSync('npm install', { stdio: 'inherit' });

console.log('All dependencies installed successfully!');
