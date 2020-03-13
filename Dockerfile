FROM node:12-alpine

RUN apk add --no-cache dumb-init # build-base

WORKDIR /src

COPY *.json /src/

RUN npm ci

COPY . /src/

ENV PORT=80

RUN yarn tsc --incremental

ENTRYPOINT ["dumb-init", "--"]

CMD node dist/entrypoint.js
