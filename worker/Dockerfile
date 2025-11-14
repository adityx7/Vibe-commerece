FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Run as non-root user
USER node

# Start the worker
CMD ["node", "index.js"]
