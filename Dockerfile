FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY api/package*.json ./api/

# Install dependencies
RUN npm install
RUN cd api && npm install

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 8800

# Command to run the application
CMD ["node", "api/index.js"]
