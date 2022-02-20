FROM node:16.5.0-alpine

ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

RUN apk --no-cache add curl jq

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . /usr/src/app
RUN npm run build
EXPOSE 9999
CMD ["npm", "start"]