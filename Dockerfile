# ===========================================
# ETAPA 1: Compilar el frontend con Vite
# ===========================================
FROM node:22-alpine AS frontend-builder
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# ===========================================
# ETAPA 2: Preparar el backend
# ===========================================
FROM node:22-alpine AS backend-builder
WORKDIR /backend
COPY backend/package.json backend/package-lock.json ./
RUN npm install --omit=dev
COPY backend/ .

# ===========================================
# ETAPA 3: Imagen final (Nginx + Backend)
# ===========================================
FROM nginx:1.27.1-alpine

# Copiar frontend compilado
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copiar backend
COPY --from=backend-builder /backend /backend

# Data directories
RUN mkdir -p /backend/data /backend/public/avatars

# Config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /backend
EXPOSE 80

CMD ["sh", "-c", "node src/index.js & nginx -g 'daemon off;'"]