# Build Stage
FROM node:20-bullseye AS build

# Install required packages
RUN apt-get update && apt-get install -y curl python3 make g++

# Install Meteor
RUN curl https://install.meteor.com/ | sh

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN meteor npm install

# Build Meteor bundle
RUN meteor build ./bundle --directory

# Runtime Stage
FROM node:20-bullseye

# Set workdir for runtime
WORKDIR /app

# Copy built app from build stage
COPY --from=build /bundle/bundle /app

# Install server node modules
WORKDIR /app/programs/server
RUN npm install

# Set environment variables
ENV PORT=3000
ENV ROOT_URL=https://your-app-name.onrender.com
ENV MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/visitorDB?retryWrites=true&w=majority&appName=Cluster0

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "main.js"]
