# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Create and set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if any)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose port (same as your app listens on)
EXPOSE 3004

# Run the app
CMD ["node", "src/app.js"]
