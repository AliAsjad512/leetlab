FROM node:18
WORKDIR /backend/index
COPY . .
RUN npm install
CMD ["node", "index.js"]