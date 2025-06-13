# Base image with Node.js
FROM node:20-alpine

# Install system dependencies required for Meteor
RUN apk add --no-cache bash curl python3 make g++ 

# Install Meteor globally
RUN curl https://install.meteor.com/ | sh

# Set working directory
WORKDIR /app

# Copy source files into container
COPY . .

# Install npm dependencies using Meteor's npm
RUN meteor npm install

# Expose app port
EXPOSE 3000

# Start Meteor app
CMD ["meteor", "run", "--port", "3000"]
