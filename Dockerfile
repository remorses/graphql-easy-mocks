FROM node:12-alpine

RUN apk add --no-cache dumb-init # build-base

WORKDIR /src

COPY *.json /src/

RUN npm ci

COPY . /src/

ENV PORT=80 MOCKS_PATH=/mocks.js

ENTRYPOINT ["dumb-init", "--"]
CMD "yarn entrypoint"
