# Stage 1
FROM node:20-alpine as deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install


# Stage 2
FROM node:20-alpine as builder
WORKDIR /app

# 1. Declare ARGs for every variable Next.js needs during build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG UPSTASH_REDIS_REST_URL
ARG UPSTASH_REDIS_REST_TOKEN
ARG GMAIL_USER
ARG GMAIL_APP_PASSWORD

# 2. Convert those ARGs into ENVs so the 'npm run build' process sees them
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL
ENV UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN
ENV GMAIL_USER=$GMAIL_USER
ENV GMAIL_APP_PASSWORD=$GMAIL_APP_PASSWORD

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3
FROM node:20-alpine as runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]