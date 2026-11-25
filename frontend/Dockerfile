FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=""
ARG VITE_WS_URL=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV PORT=80 \
    NGINX_ENVSUBST_FILTER=^PORT$
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
