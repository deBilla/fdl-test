# Use an official Node.js runtime as a parent image
# Using alpine for a smaller image size
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# This step leverages Docker layer caching. If these files haven't changed,
# Docker won't need to re-run 'npm install' in subsequent builds.
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source inside Docker image
# Copy local CWD files to container CWD (/app)
COPY . .

# Make port 5001 available to the world outside this container
# This should match the PORT your Node.js app listens on
EXPOSE 5001

# Define the command to run the app
# This will be overridden by the 'command: npm run dev' in docker-compose.yml
# but is good practice to have a default.
CMD ["npm", "run", "dev"]
