FROM node:alpine

WORKDIR /app

EXPOSE 7860
COPY . .
RUN apk update && apk upgrade &&\
    apk add --no-cache openssl curl gcompat iproute2 coreutils &&\
    apk add --no-cache bash &&\
    npm install

CMD node bot.js&
