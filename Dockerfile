FROM node:20-alpine

WORKDIR /app

# Needed by some Node native deps on Alpine
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .

ENV CI=1
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN npx expo export -p web

EXPOSE 8080

CMD ["node", "server.js"]
