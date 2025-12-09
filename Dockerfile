# 🚀 Advanced Live Chat SaaS - Railway Deployment Dockerfile
# Multi-stage build for optimal performance - PostgreSQL Version

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source code
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend (NO MIGRATIONS HERE)
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source code (DON'T RUN MIGRATIONS DURING BUILD)
COPY backend/ ./

# Stage 3: Production image
FROM node:18-alpine AS production

# Install system dependencies (NO SQLITE)
RUN apk add --no-cache curl postgresql-client

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy backend files
COPY --from=backend-builder /app/backend ./backend

# Copy frontend build files
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy root package files
COPY package*.json ./
COPY deploy.js ./
COPY ecosystem.config.js ./
COPY railway-startup.js ./
COPY single-url-deploy-improved.js ./
COPY railway-final-start.js ./
COPY fix-railway-db.js ./

# Install production dependencies
RUN npm ci --only=production

# Create logs directory
RUN mkdir -p logs

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application for Railway
CMD ["npm", "run", "start:railway"]