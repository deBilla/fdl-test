# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the client application code
COPY . .

# Make port 3000 available (React default dev server port)
EXPOSE 3000

# Command to run the React development server
# This is typically 'npm start' for Create React App or Vite projects
CMD ["npm", "start"]
