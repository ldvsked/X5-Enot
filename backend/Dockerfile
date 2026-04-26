# ЭТАП 1: Сборка (Builder)
FROM golang:1.26-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY go.mod go.sum ./
RUN go mod download

# Копируем весь исходный код бэкенда
COPY . .

# ДОБАВЬ ЭТУ СТРОКУ ТУТ:
RUN go mod tidy


# Собираем бинарный файл (CGO_ENABLED=0 нужен для запуска в alpine)
RUN CGO_ENABLED=0 GOOS=linux go build -o x5-enot-backend .


# ЭТАП 2: Запуск (Final image)
FROM alpine:latest

WORKDIR /app

# Копируем только скомпилированный бинарник из первого этапа
COPY --from=builder /app/x5-enot-backend .

# Копируем папку со статикой (еноты, мемы), она нужна во время работы
COPY --from=builder /app/static ./static

# Открываем порт, на котором работает Gin
EXPOSE 8080

# Запускаем приложение
CMD ["./x5-enot-backend"]
