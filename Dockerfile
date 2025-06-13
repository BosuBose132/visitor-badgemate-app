# Use official Node 20 Alpine image
FROM node:20-alpine

# Install required packages: curl, bash (required by Meteor installer)
RUN apk add --no-cache curl bash

# Install Meteor
RUN curl https://install.meteor.com/ | sh

# Set working directory inside container
WORKDIR /app

# Copy all files from local directory to container workdir
COPY . .

# Install dependencies via Meteor
RUN meteor npm install

# Expose port (optional but good practice)
EXPOSE 3000

# Start the Meteor app
CMD ["meteor", "run"]
