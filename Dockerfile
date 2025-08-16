FROM node:16-buster

WORKDIR /app

# Install system dependencies for sharp
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./
COPY api/package*.json ./api/

# Install root dependencies
RUN npm install

# Copy all application files
COPY . .

# Install API dependencies with special handling for sharp
WORKDIR /app/api

# Modify package.json to remove sharp dependency
RUN node -e "const pkg = require('./package.json'); delete pkg.dependencies.sharp; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"

# Install API dependencies without sharp
RUN npm install

# Install sharp with specific version and flags
RUN npm install sharp@0.30.7 --unsafe-perm

# Verify sharp installation
RUN node -e "try { const sharp = require('sharp'); console.log('Sharp version:', sharp.versions.sharp); } catch(e) { console.error('Sharp installation failed:', e); process.exit(1); }"

# Expose the port the app runs on
EXPOSE 8800

# Command to run the application
WORKDIR /app
CMD ["node", "api/index.js"]
