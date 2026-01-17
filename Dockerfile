FROM node:alpine
# 设置镜像源
# RUN echo "http://mirrors.aliyun.com/alpine/latest-stable/main/" > /etc/apk/repositories \
    # && echo "http://mirrors.aliyun.com/alpine/latest-stable/community/" >> /etc/apk/repositories
WORKDIR /app
COPY . /app
EXPOSE 7860
RUN apk update && apk upgrade &&\
    apk add --no-cache openssl curl gcompat iproute2 coreutils &&\
    apk add --no-cache bash &&\
    npm install

CMD node bot.js&
