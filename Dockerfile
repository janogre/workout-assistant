# Multi-stage build for production

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./
RUN npm ci

# Copy frontend source
COPY . .

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build frontend
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

# Install serve and wget for healthcheck
RUN apk add --no-cache wget && npm install -g serve

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist /app/dist

# Copy backend from stage 2
COPY --from=backend-builder /app/node_modules /app/server/node_modules
COPY server /app/server

# Expose ports
EXPOSE 3000 3001

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting backend on port ${PORT:-3001}..."' >> /app/start.sh && \
    echo 'cd /app/server && node index.js &' >> /app/start.sh && \
    echo 'BACKEND_PID=$!' >> /app/start.sh && \
    echo 'echo "Backend started with PID $BACKEND_PID"' >> /app/start.sh && \
    echo 'echo "Starting frontend on port 3000..."' >> /app/start.sh && \
    echo 'serve -s /app/dist -l 3000' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
