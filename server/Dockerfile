# =======================================================
# IronPulse 自主部署后端 Dockerfile
# 轻量化 Alpine 镜像构建，低内存消耗 (<80MB)
# =======================================================

FROM node:22-alpine AS builder

WORKDIR /app

# 安装 SQLite 原生编译构建工具
RUN apk add --no-cache python3 make g++

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

# 生产运行阶段
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/ironpulse.sqlite

# 仅安装生产依赖
COPY package*.json ./
RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev \
    && apk del python3 make g++

COPY --from=builder /app/dist ./dist

# 持久化数据挂载卷
VOLUME ["/app/data"]

EXPOSE 3001

CMD ["node", "dist/index.js"]
