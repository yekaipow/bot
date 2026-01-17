FROM node:20-alpine3.20
RUN apk update && apk upgrade &&\
    apk add --no-cache curl wget unzip &&\
    apk add --no-cache bash &&\
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 7860
CMD ["node", "bot.js"]