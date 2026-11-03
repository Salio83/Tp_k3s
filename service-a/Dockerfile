FROM node:22-alpine

WORKDIR /app
COPY package.json ./
RUN npm install
COPY app.js ./

EXPOSE 8082
CMD ["node", "app.js"]
