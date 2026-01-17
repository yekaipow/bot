FROM node:20-alpine3.20

# 更新并安装必要的包
RUN apk add --no-cache --update curl wget unzip bash && \
    rm -rf /var/cache/apk/*

# 设置工作目录
WORKDIR /app

# 复制 package 文件并安装依赖
COPY package*.json ./
RUN npm install --production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 7860

# 启动命令
CMD ["node", "bot.js"]