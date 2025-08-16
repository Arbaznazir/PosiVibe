FROM node:18

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

# Install API dependencies with explicit platform flags for sharp
WORKDIR /app/api

# Clean any existing sharp installation to avoid conflicts
RUN rm -rf node_modules/sharp

# Install sharp with explicit platform flags
RUN npm install --platform=linux --arch=x64 sharp

# Install remaining dependencies
RUN npm install --include=optional

# Fix for ES modules compatibility
RUN npm rebuild

# Return to app directory and copy the rest of the application
WORKDIR /app
COPY . .

# Expose the port the app runs on
EXPOSE 8800

# Command to run the application
CMD ["node", "api/index.js"]
