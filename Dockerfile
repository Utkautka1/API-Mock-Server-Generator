# Многоэтапная сборка для оптимизации размера образа
# Этап 1: Сборка
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы конфигурации пакетов
COPY package*.json ./
COPY packages/*/package.json ./packages/*/
COPY packages/*/*/package.json ./packages/*/*/ || true

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Этап 2: Продакшен
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем только production зависимости
COPY package*.json ./
COPY packages/*/package.json ./packages/*/
COPY packages/*/*/package.json ./packages/*/*/ || true
RUN npm ci --production

# Копируем собранные файлы из builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/packages/*/dist ./packages/*/dist

# Открываем порт
EXPOSE 3000

# Запускаем CLI
CMD ["node", "packages/cli/dist/cli.js", "generate", "/app/spec.yaml", "--port", "3000", "--host", "0.0.0.0"]
