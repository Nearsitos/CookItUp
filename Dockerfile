FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY client ./client

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "server"]
