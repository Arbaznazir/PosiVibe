FROM node:18-bullseye

WORKDIR /app

# Install system dependencies for sharp
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libvips-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./
COPY api/package*.json ./api/

# Install root dependencies
RUN npm install

# Move to API directory
WORKDIR /app/api

# Remove any existing sharp installation
RUN rm -rf node_modules/sharp

# Install API dependencies WITHOUT sharp first
RUN npm install --omit=optional

# Install sharp with specific version and all flags
RUN npm install --platform=linux --arch=x64 sharp@0.32.6 --build-from-source

# Verify sharp installation
RUN node -e "try { require('sharp'); console.log('Sharp installed successfully'); } catch(e) { console.error(e); process.exit(1); }"

# Return to app directory and copy the rest of the application
WORKDIR /app
COPY . .

# Expose the port the app runs on
EXPOSE 8800

# Command to run the application
CMD ["node", "api/index.js"]
