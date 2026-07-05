# Build context is this "frontend" directory (docker-compose.yml build.context: ./frontend)
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* variables into the bundle at build time.
ARG VITE_API_URL=http://localhost:44348
ARG VITE_AUTHORITY=http://localhost:44348
ARG VITE_CLIENT_ID=Dentify_App
ARG VITE_SCOPE="openid profile email phone roles Dentify offline_access"
ENV VITE_API_URL=$VITE_API_URL \
    VITE_AUTHORITY=$VITE_AUTHORITY \
    VITE_CLIENT_ID=$VITE_CLIENT_ID \
    VITE_SCOPE=$VITE_SCOPE

RUN npm run build

FROM nginx:1.27-alpine AS final
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
