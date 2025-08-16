FROM node:18

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

# Install dependencies with sharp properly configured
RUN npm install
RUN cd api && npm install --include=optional sharp

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 8800

# Command to run the application
CMD ["node", "api/index.js"]
