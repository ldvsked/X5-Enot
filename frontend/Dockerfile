FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--port", "4173"]
