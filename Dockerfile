FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN apk update && apk upgrade &&\
    apk add --no-cache openssl curl wget unzip &&\
    apk add --no-cache bash &&\
RUN npm install --production
COPY . .
EXPOSE 7860
CMD ["node", "bot.js"]