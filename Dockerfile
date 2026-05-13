# Step 1: Build production files
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve with Nginx
FROM nginx:stable-alpine
# PENTING: Gunakan tanda = di bawah ini
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copy custom config untuk handling SPA (React Router) agar tidak 404 saat refresh
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]