# ChatNest

A full-stack real-time chat application supporting direct messages and group conversations, built with React, Express, Socket.io, and MongoDB.

## Features

- **Real-time messaging** - Instant message delivery via Socket.io
- **Direct messages & group chats** - One-to-one and multi-person conversations
- **Read receipts** - Track who has read messages in conversations
- **Message reactions** - Add emoji reactions to messages
- **Image sharing** - Send and view images with lightbox support
- **Message search** - Search conversations and messages by text
- **Push notifications** - Service worker based web push notifications
- **Online status** - Real-time online/offline user indicators
- **Theme system** - 32 DaisyUI themes with live preview
- **Profile management** - Avatar upload and profile customization
- **Responsive design** - Mobile and desktop friendly

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, DaisyUI |
| State Management | Zustand, TanStack React Query |
| Backend | Express.js, TypeScript, TSOA |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io |
| Auth | JWT (cookie-based) |
| Image Upload | Cloudinary |
| API Docs | Swagger (auto-generated via TSOA) |
| Deployment | Docker Compose, Nginx, Let's Encrypt |

## Project Structure

```
chat-nest/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── controllers/  # TSOA controllers (auth, user, conversation)
│   │   ├── models/       # Mongoose schemas (user, message, conversation)
│   │   ├── middlewares/   # JWT auth middleware
│   │   ├── lib/          # Socket.io, Cloudinary, DB connection
│   │   ├── seeds/        # Database seeding
│   │   └── server.ts     # App entry point
│   └── Dockerfile
├── frontend/             # React SPA
│   ├── src/
│   │   ├── pages/        # Route pages & page components
│   │   ├── api/          # API client (Axios + generated types)
│   │   ├── stores/       # Zustand stores (auth, chat, theme)
│   │   ├── components/   # Shared UI components
│   │   └── lib/          # Utilities, notifications, query client
│   └── vite.config.ts
├── shared/               # Shared types & socket event definitions
├── nginx/                # Nginx reverse proxy config
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- MongoDB instance
- Cloudinary account

### Environment Variables

Create `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/chatnest
PORT=3000
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

### Development

**Backend:**

```bash
cd backend
pnpm install
pnpm dev
```

**Frontend:**

```bash
cd frontend
pnpm install
pnpm dev
```

The backend runs on `http://localhost:3000`, the frontend dev server proxies API requests to it.

API documentation is available at `http://localhost:3000/api-docs` (Swagger UI).

### Database Seeding

```bash
cd backend
pnpm seed
```

### Production (Docker Compose)

```bash
# First time: set up SSL certificates
sudo bash init-letsencrypt.sh

# Start all services
docker compose up -d
```

This starts:
- Backend Express server
- Frontend static build served by Nginx
- Nginx reverse proxy with HTTPS (ports 80/443)
- Certbot for automatic SSL certificate renewal

## Scripts

### Backend

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Run production build |
| `pnpm seed` | Seed database with sample users |
| `pnpm tsoa:spec` | Generate OpenAPI spec |
| `pnpm tsoa:routes` | Generate TSOA routes |

### Frontend

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | TypeScript check + production build |
| `pnpm preview` | Preview production build |
| `pnpm generate:api` | Generate API types from OpenAPI spec |

## License

MIT
