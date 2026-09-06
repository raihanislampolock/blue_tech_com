# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.17.0

# ==========================================
# Base stage
# ==========================================
FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /usr/src/app

# Install system dependencies required by npm packages
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    bash

# Make "python" command available
RUN ln -sf /usr/bin/python3 /usr/bin/python


# ==========================================
# Build stage
# ==========================================
FROM base AS build

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies including devDependencies
RUN npm ci

# Copy application source
COPY . .

# Copy config
COPY config.json .

# Build TypeScript, Sass, lint and static assets
RUN npm run build


# ==========================================
# Production stage
# ==========================================
FROM base AS final

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled application
COPY --from=build /usr/src/app/build ./build

# Copy Pug views
COPY --from=build /usr/src/app/views ./views

# Copy config
COPY --from=build /usr/src/app/config.json ./config.json

# Application port
EXPOSE 3005

# Start application
CMD ["node", "build/app.js"]