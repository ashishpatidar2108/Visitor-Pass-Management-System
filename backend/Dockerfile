FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
RUN mkdir -p storage/uploads storage/badges

EXPOSE 5000

CMD ["npm", "start"]
