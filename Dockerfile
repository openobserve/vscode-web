# Use minimal official Node.js image
FROM node:20.18.1-slim

# Set working directory
WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends zip git python3 make g++ build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

# Copy only package files first to leverage Docker cache
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the app files
COPY . .

# Build the project
RUN yarn build

# Prepare the demo
RUN yarn o2-prepare-demo
