FROM node:16.5.0

RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci --loglevel error

COPY . .

RUN npm run build

RUN chown -R node /usr/src/app

USER node

EXPOSE 4000

CMD ["node", "dist/main.js"]