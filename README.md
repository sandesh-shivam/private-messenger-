# Private Messenger Website

A mobile-first private messenger for a small fixed group of users.

## Included
- Single login page
- Admin/user branching from the same page
- 1-to-1 private chat only
- Text messages
- Photo messages
- Emoji picker
- Reply to a message
- Edit a sent text message
- Delete for me / delete for everyone
- Copy message text
- Audio call UI with WebRTC signaling
- Last seen / online status
- Unread badge
- Panic button
- 2-minute inactivity logout
- Single-device login
- Temporary storage for offline messages
- Per-conversation end-to-end encryption (ECDH + AES-GCM)

## Encryption model
Each user has an ECDH (P-256) identity keypair generated in the browser
and kept in that browser's `localStorage`. Only the **public** key is
sent to the server (via `POST /api/keys`) so other users can derive a
shared AES-GCM key with them. The **private** key never leaves the
device, so the server (and anyone with access to it) can only ever see
ciphertext — it cannot derive the shared key itself. Every contact pair
gets its own unique shared key, unlike a single global secret.

Trade-off: because the identity key lives in `localStorage` rather than
a synced secure enclave, logging into the same account from a new
device/browser mints a new identity key for that device. Messages sent
to an offline user are encrypted with that user's last-published public
key, so they remain readable once the user reconnects — matching the
"deliver later" requirement — but this is not a full Signal-style
double-ratchet protocol with forward secrecy per message.

## Important note
This is a starter project and demo architecture. The encrypted payload flow is implemented, but you should still review security, session handling, and production hosting before using it with real users.

## Demo logins
- Admin: `admin / admin123`
- User: `vishal / pass123!`
- User: `kashish / pass123!`

## Run locally

### 1) Install dependencies
```bash
npm install
npm install --workspace server
npm install --workspace client
```

### 2) Create env files
Copy the example files:
- `server/.env.example` -> `server/.env`
- `client/.env.example` -> `client/.env`

### 3) Start both apps
```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:4000

## Production Deployment

### Option A: Docker (Recommended)
```bash
# 1) Start container with persistent data volume
docker compose up -d --build

# 2) View logs
docker compose logs -f
```

### Option B: PM2 (Node process manager)
```bash
# 1) Build client and verify server
npm run build

# 2) Start server with PM2
pm2 start ecosystem.config.cjs --env production

# 3) Save PM2 process list for auto-boot on server restart
pm2 save
pm2 startup
```

### Option C: Direct Node production run
```bash
# 1) Build client
npm run build

# 2) Run production server (serves both API & Frontend SPA)
NODE_ENV=production PORT=4000 node server/index.js
```

### Production Security Checklist
- Set a strong, random `JWT_SECRET` in `server/.env`.
- Ensure `CLIENT_ORIGIN` lists your production domain(s).
- Run behind HTTPS (e.g. Nginx, Caddy, Cloudflare, or Let's Encrypt).
- Atomic persistence with automated `.bak` backups prevents data corruption.
- API rate limiting (`express-rate-limit`) and security headers (`helmet`) are enabled by default.

## Notes
- Messages are end-to-end encrypted (ECDH + AES-GCM) in the browser before being sent.
- If both users are online, the server forwards the encrypted payload in real time.
- If a user is offline, encrypted payloads are stored temporarily until seen.
- Call history is ephemeral (WebRTC signaling only).

