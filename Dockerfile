FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create app directory (if it doesn't exist)
RUN mkdir -p /usr/src/app

# Expose port
EXPOSE 10000

# Start application
CMD ["npm", "start"]
