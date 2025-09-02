# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the project
COPY . .

# Expose port (your app listens on 3000)
EXPOSE 3000

# Run your main script
CMD ["node", "src/app.js"]
