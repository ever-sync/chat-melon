# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Build com valores placeholder (serão substituídos em runtime)
ENV VITE_SUPABASE_URL=RUNTIME_REPLACE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=RUNTIME_REPLACE
ENV VITE_SUPABASE_PROJECT_ID=RUNTIME_REPLACE
ENV VITE_EVOLUTION_API_URL=RUNTIME_REPLACE
ENV VITE_EVOLUTION_API_KEY=RUNTIME_REPLACE
ENV VITE_GOOGLE_CLIENT_ID=RUNTIME_REPLACE
ENV VITE_REDIS_URL=RUNTIME_REPLACE_REDIS_URL
ENV VITE_REDIS_TOKEN=RUNTIME_REPLACE
ENV VITE_CACHE_ENABLED=true

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# Use entrypoint to inject env vars at runtime
ENTRYPOINT ["/docker-entrypoint.sh"]