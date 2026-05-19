# ChatFusion 🚀

A production-grade real-time communication platform featuring end-to-end encrypted messaging, P2P video calling, and screen sharing — built with modern web technologies.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-white?style=for-the-badge&logo=socket.io)
![WebRTC](https://img.shields.io/badge/WebRTC-P2P-blue?style=for-the-badge)
![Redis](https://img.shields.io/badge/Redis-Upstash-red?style=for-the-badge&logo=redis)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)

---

## ✨ Features

- 🔐 **End-to-End Encrypted Messaging** — Messages encrypted client-side using asymmetric key cryptography. Server never sees plaintext.
- 📹 **P2P Video & Audio Calling** — WebRTC with native DTLS/SRTP encryption for secure, low-latency HD calls.
- 🖥️ **Screen Sharing** — Share your screen mid-call with one click using `getDisplayMedia()`.
- 🟢 **Real-time Presence** — See who's online instantly via Redis TTL-based heartbeat system.
- ⚡ **Instant Messaging** — Messages delivered in real-time via Socket.IO persistent connections.
- 💬 **Typing Indicators** — Live typing status with automatic stop detection.
- 🔔 **Push Notifications** — Browser notifications for messages received while away.
- 🛡️ **Rate Limiting** — Redis-based rate limiting (10 messages/60s) to prevent abuse.
- 📎 **Image Sharing** — Send images via Cloudinary CDN with instant preview.
- 💬 **Reply & Reactions** — Reply to specific messages and react with emojis.
- 👥 **Friend System** — Send/accept friend requests, manage your network.

---

## 🏗️ Architecture

```
Client (Next.js)
      ↕ HTTP (REST API)
      ↕ WebSocket (Socket.IO)
Custom Next.js + Socket.IO Server
      ↕                    ↕
PostgreSQL (Supabase)    Redis (Upstash)
      ↕
Cloudinary (Media)
```

### Real-time Flow
```
User A sends message
→ POST /api/conversations/{id}/message
→ Rate limit check (Redis INCR)
→ Message saved to PostgreSQL via Prisma
→ Server emits 'message:new' via Socket.IO
→ User B receives instantly (< 100ms)
```

### Presence Flow
```
User opens app
→ Socket.IO connection established
→ POST /api/presence/heartbeat every 30s
→ Redis SET user:online:{id} = 1, TTL 60s
→ User closes tab → key auto-expires → offline
→ Friends see green dot update instantly
```

### Call Flow
```
Caller clicks call button
→ POST /api/call/initiate → saved to DB
→ Redis SET call:pending:{receiverId} TTL 60s
→ Socket.IO emits 'call:incoming' to receiver
→ Receiver accepts → WebRTC handshake begins
→ SDP offer/answer exchanged via Socket.IO
→ ICE candidates exchanged via Socket.IO
→ P2P connection established (DTLS/SRTP)
→ Audio/video streams directly peer-to-peer
```

### E2E Encryption Flow
```
User registers
→ Asymmetric keypair generated (libsodium)
→ Public key stored in DB
→ Private key encrypted → stored in DB

User sends message
→ Encrypted with recipient's public key
→ Ciphertext stored on server (never plaintext)

Recipient receives
→ Decrypted with own private key client-side
→ Plaintext shown only in UI
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS, ShadcnUI |
| Real-time | Socket.IO 4.8 (WebSocket) |
| Video/Audio | WebRTC (P2P, DTLS/SRTP) |
| Database | PostgreSQL via Supabase + Prisma ORM |
| Cache | Redis (Upstash) |
| Auth | Supabase Auth (Email + OAuth) |
| Storage | Cloudinary |
| State | Zustand + TanStack Query |
| DevOps | Docker + GitHub Actions + Render |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- [Supabase](https://supabase.com) account
- [Upstash](https://upstash.com) Redis database
- [Cloudinary](https://cloudinary.com) account

### 1. Clone the repository

```bash
git clone https://github.com/abhiKumar0/ChatFusion.git
cd ChatFusion
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create `.env.local` in the root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (Prisma)
DATABASE_URL=your_pooled_connection_string
DIRECT_URL=your_direct_connection_string

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
GMAIL_USER=your_gmail
GMAIL_APP_PASSWORD=your_app_password
```

### 4. Set up the database

```bash
npx prisma db pull
npx prisma generate
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🐳 Docker

```bash
docker-compose up --build
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/             # Authentication routes
│   │   ├── call/             # Call management
│   │   ├── conversations/    # Messaging
│   │   ├── presence/         # Online status
│   │   └── users/            # User management
│   ├── chat/                 # Chat UI
│   ├── call/                 # Call UI
│   └── auth/                 # Auth pages
├── components/
│   ├── providers/
│   │   └── RealtimeProvider.tsx  # Socket.IO setup
│   ├── calls/                # Video call components
│   └── ui/                   # ShadcnUI components
├── store/
│   ├── useCallStore.tsx       # Call state + WebRTC
│   ├── usePresenceStore.ts    # Online status
│   └── useChatStore.ts        # Chat state
├── lib/
│   ├── socket.ts              # Socket.IO client
│   ├── redis.ts               # Redis client
│   ├── prisma.ts              # Prisma client
│   └── crypto.ts              # E2E encryption
└── services/
    ├── MessageService.ts
    ├── CallService.ts
    └── PresenceService.ts
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/signup` | Register new account |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/callback` | OAuth callback |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | Get all conversations |
| GET | `/api/conversations/{id}` | Get conversation |
| GET | `/api/conversations/{id}/message` | Get messages (paginated) |
| POST | `/api/conversations/{id}/message` | Send message |

### Calls
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/call/initiate` | Start a call |
| GET | `/api/call/pending` | Check pending calls |
| DELETE | `/api/call/pending` | Clear pending call |
| PUT | `/api/call/{id}/answer` | Answer a call |

### Presence
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/presence/heartbeat` | Update online status |
| GET | `/api/presence?ids=...` | Get presence for user IDs |

---

## 🔌 WebSocket Events

```
Client → Server:
  conversation:join       → join a chat room
  conversation:leave      → leave a chat room
  typing:start            → user started typing
  typing:stop             → user stopped typing
  message:seen            → messages marked as read
  call:answer             → SDP answer to caller
  call:ice-candidate      → ICE candidate exchange
  call:end                → end active call

Server → Client:
  message:new             → new message received
  typing:start/stop       → opponent typing status
  presence:update         → friend online/offline
  call:incoming           → incoming call data
  call:answered           → call accepted
  call:ended/rejected     → call terminated
  call:ice-candidate      → ICE candidate from peer
```

---

## 🔐 Security

- **E2E Encryption** — All messages encrypted client-side using libsodium asymmetric cryptography
- **Supabase RLS** — Row Level Security policies on all database tables
- **Next.js Middleware** — Session-aware route protection on all authenticated routes
- **Redis Rate Limiting** — 10 messages per 60 seconds per user
- **WebRTC DTLS/SRTP** — All video/audio streams encrypted in transit

---

## 📊 System Design Decisions

**Why Socket.IO over Supabase Realtime?**
> Supabase Realtime creates N WebSocket connections for N users all syncing state with each other. Socket.IO uses one persistent connection per user with server-side room management — significantly more efficient at scale.

**Why Redis for presence?**
> Redis TTL keys auto-expire when a user closes their tab — zero manual cleanup. `MGET` fetches presence for all friends in a single round trip regardless of friend count.

**Why Redis for call notifications?**
> Replacing 2-second Supabase DB polling with a Redis key lookup reduced call notification latency from ~2s to under 100ms and eliminated unnecessary database load.

**Why Prisma over raw Supabase SDK?**
> Prisma provides compile-time type safety, cleaner query syntax, and enforces a proper service layer. Raw SDK queries mixed business logic with data access making the codebase harder to maintain.

---

## ⚙️ CI/CD Pipeline

```
push to master
  → lint check (ESLint)
  → build check (Next.js production build)
  → Docker image build
  → auto deploy on Render
```

---

## 🌐 Deployment

Live at: **[chatfusion.onrender.com](https://chatfusion.onrender.com)**

Deployed on **Render** with:
- Custom Next.js + Socket.IO server (`server.ts`)
- Multi-stage Docker build (`node:20-alpine`)
- Automatic deploys on push to `master`
- Environment variables managed via Render dashboard

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use this project for learning or portfolio purposes.

---

<p align="center">Built with ❤️ by <a href="https://github.com/abhiKumar0">Abhishek Kumar</a></p>
