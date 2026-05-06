# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS build
WORKDIR /app
COPY src/web-vue/package.json src/web-vue/package-lock.json* ./
RUN npm install --include=dev
COPY src/web-vue/ ./
RUN npm run build

FROM nginx:alpine AS runtime
COPY docker/nginx.vue.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
