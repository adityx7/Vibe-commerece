FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose API port
EXPOSE 4000

# Run as non-root user
USER node

# Start the application
CMD ["node", "index.js"]
