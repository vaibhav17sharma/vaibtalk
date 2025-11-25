# VaibTalk

A modern real-time communication platform built with Next.js, featuring video/audio calls, instant messaging, and peer-to-peer connections.

## Features

- 🎥 **Video & Audio Calls** - WebRTC-based peer-to-peer calling
- 💬 **Real-time Messaging** - Instant messaging with file sharing
- 👥 **Contact Management** - Add and manage contacts
- 🔒 **Secure Authentication** - NextAuth.js integration
- 🌓 **Dark Mode** - Beautiful UI with theme support
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: PeerJS for WebRTC
- **State Management**: Redux Toolkit
- **Deployment**: Docker & Docker Compose

## Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your database credentials
# Update DATABASE_URL to point to your PostgreSQL

# 3. Generate NEXTAUTH_SECRET
openssl rand -base64 32  # Copy this to .env

# 4. Start services
docker-compose up -d
```

Access the application at http://localhost:3000

For detailed Docker instructions, see [DOCKER.md](./DOCKER.md)

### Option 2: Local Development

#### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database
- PeerJS server (or use Docker for just the services)

#### Setup

1. **Install dependencies**

```bash
pnpm install
```

2. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your database and auth credentials
```

3. **Start supporting services (Database + PeerJS)**

```bash
docker-compose -f docker-compose.dev.yml up -d
```

4. **Run database migrations**

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

5. **Start development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Docker Commands

```bash
make help         # Show all available commands
make up           # Start all services
make down         # Stop all services
make logs         # View logs
make rebuild      # Rebuild and restart
```

See [DOCKER.md](./DOCKER.md) for complete Docker documentation.

## Project Structure

```
vaibtalk/
├── app/              # Next.js app directory
├── components/       # React components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and configurations
├── prisma/           # Database schema and migrations
├── public/           # Static assets
├── store/            # Redux store
├── types/            # TypeScript type definitions
└── docker-compose.yml # Docker configuration
```

## Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `NEXT_PUBLIC_PEER_SERVER_HOST` - PeerJS server host
- `NEXT_PUBLIC_PEER_SERVER_PORT` - PeerJS server port

## Database

This project uses PostgreSQL with Prisma ORM.

```bash
# Run migrations
pnpm prisma migrate dev

# Generate Prisma Client
pnpm prisma generate

# Open Prisma Studio
pnpm prisma studio
```

## Deployment

### Docker Deployment

1. Update `.env` with production values
2. Build and start services:

```bash
docker-compose up -d --build
```

### Traditional Deployment

1. Build the application:

```bash
pnpm build
```

2. Start the production server:

```bash
pnpm start
```

For detailed deployment instructions, see [DOCKER.md](./DOCKER.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
