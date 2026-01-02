#Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "server.js"]
