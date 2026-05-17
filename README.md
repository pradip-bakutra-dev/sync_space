# SyncSpace

Meet, collaborate, and stay in sync — a lightweight video meeting app for friends. Create a room in one click or join with a 6-letter code.

## Features

- **Instant rooms** — generate a room code and share it with friends
- **Pre-join lobby** — preview camera and mic before entering
- **Peer-to-peer video** — WebRTC with Socket.IO signaling
- **Simple UI** — dark theme, minimal flow from landing to call

## Tech stack

| Layer    | Stack                                      |
| -------- | ------------------------------------------ |
| Client   | React 19, TypeScript, Vite, Tailwind CSS   |
| Server   | Node.js, Express, Socket.IO                |
| Realtime | WebRTC (with configurable TURN for NAT)    |

## Project structure

```
sync_space/
├── client/          # React frontend (Vite)
│   └── public/      # logo, favicon, web manifest
├── server/          # Signaling server (Socket.IO)
└── package.json     # npm workspaces root
```

## Getting started

### Prerequisites

- Node.js 20+
- npm 9+

### Install

From the repository root:

```bash
npm install
```

### Development

Run the signaling server and client in separate terminals:

```bash
# Terminal 1 — server (default http://localhost:3001)
npm run dev:server

# Terminal 2 — client (default http://localhost:5173)
npm run dev:client
```

Open the client URL in your browser. The client connects to the server via `VITE_SERVER_URL` (defaults to `http://localhost:3001` when unset).

### Environment variables

**Server** (`server/.env` — copy from `server/.env.example`):

| Variable     | Description                          | Default                 |
| ------------ | ------------------------------------ | ----------------------- |
| `PORT`       | HTTP port                            | `3001`                  |
| `NODE_ENV`   | `development` or `production`      | `development`           |
| `CLIENT_URL` | Allowed CORS origin in production    | `http://localhost:5173` |

**Client** (`client/.env` or `client/.env.production`):

| Variable               | Description              |
| ---------------------- | ------------------------ |
| `VITE_SERVER_URL`      | Signaling server URL     |
| `VITE_TURN_URL`        | TURN server URL (optional) |
| `VITE_TURN_USERNAME`   | TURN username            |
| `VITE_TURN_CREDENTIAL` | TURN credential          |

### Build

```bash
# Client
npm run build --workspace=client

# Server
npm run build --workspace=server
```

## Deployment

- **Client** — static build from `client/` (e.g. Vercel; see `client/vercel.json` for SPA rewrites)
- **Server** — Node service (e.g. Render; see `server/render.yaml`)

Set `VITE_SERVER_URL` in the client to your deployed server URL, and `CLIENT_URL` on the server to your deployed client origin.

## Branding assets

Static assets live in `client/public/`:

- `logo.png` — header and social preview image
- `favicon.png` / `favicon-32.png` — browser tab icons (rounded, cropped)
- `site.webmanifest` — PWA metadata

Page metadata and icons are configured in `client/index.html`.

## License

Private project.

---

Developed by PSB
