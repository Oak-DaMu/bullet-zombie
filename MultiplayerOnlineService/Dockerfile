FROM node:18.12.1-alpine as build-stage

WORKDIR /app

COPY package.json .

# RUN npm config set registry https://registry.npmmirror.com/

RUN npm install --loglevel verbose

COPY . .

RUN npm run build

COPY config.yml /app/dist

# production stage
FROM node:18.12.1-alpine as production-stage

COPY --from=build-stage /app/dist /app
COPY --from=build-stage /app/package.json /app/package.json

WORKDIR /app

# RUN npm config set registry https://registry.npmmirror.com/

RUN npm install --production --loglevel verbose

EXPOSE 1868

CMD ["node", "/app/main.js"]
