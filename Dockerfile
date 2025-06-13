# Use official Meteor build image
FROM zodern/meteor:latest

# Set your working directory
WORKDIR /app

# Copy source code
COPY . .

# Install dependencies
RUN meteor npm install

# Build Meteor app
RUN meteor build --directory /app-build --server-only --allow-superuser

# Move to built directory
WORKDIR /app-build/bundle/programs/server

# Install server npm dependencies
RUN meteor npm install

# Use node base image for runtime
FROM node:20-alpine

# Set workdir
WORKDIR /app

# Copy built app from previous stage
COPY --from=0 /app-build/bundle /app

# Set environment variables
ENV PORT=3000
ENV ROOT_URL=https://your-render-url.onrender.com
ENV MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/visitorDB?retryWrites=true&w=majority

RUN meteor npm install

# Start server
CMD ["node", "main.js"]
