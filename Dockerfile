# Multi-stage build for production

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./
RUN npm ci

# Copy frontend source
COPY . .

# Build frontend (excluding server folder)
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY server/package*.json ./
RUN npm ci --production

# Stage 3: Production image
FROM node:20-alpine

WORKDIR /app

# Install serve for frontend and copy backend dependencies
RUN npm install -g serve

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist /app/dist

# Copy backend from stage 2
COPY --from=backend-builder /app/node_modules /app/server/node_modules
COPY server /app/server

# Expose ports
EXPOSE 3000 3001

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/server && node index.js &' >> /app/start.sh && \
    echo 'serve -s /app/dist -l 3000' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
