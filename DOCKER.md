# VaibTalk Docker Configuration - Updated

## 🎯 Architecture Overview

Your Docker setup has been optimized with the following configuration:

### Services

1. **Next.js Application** (Port 3000) - ✅ **EXPOSED to host**
2. **PeerJS Server** (Port 9000) - ❌ **NOT exposed in production** (internal only)
3. **PostgreSQL Database** - ❌ **NOT included** (using your existing global container)

### Port Exposure

| Service     | Production       | Development  | Notes                            |
| ----------- | ---------------- | ------------ | -------------------------------- |
| Next.js App | ✅ Port 3000     | ✅ Port 3000 | Only service exposed to host     |
| PeerJS      | ❌ Internal only | ✅ Port 9000 | Exposed in dev for local testing |
| PostgreSQL  | N/A              | N/A          | Using external container         |

---

## 🚀 Quick Start

### 1. Environment Setup

Copy and configure your environment:

```bash
cp .env.example .env
```

Update your `.env` with:

```env
# Your existing PostgreSQL connection
DATABASE_URL=postgresql://user:password@host.docker.internal:5432/vaibtalk?schema=public

# NextAuth configuration
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:3000

# PeerJS configuration (internal in production)
NEXT_PUBLIC_PEER_SERVER_HOST=localhost
NEXT_PUBLIC_PEER_SERVER_PORT=9000
NEXT_PUBLIC_PEER_SERVER_PATH=/peerjs
```

**Important**: Use `host.docker.internal` in `DATABASE_URL` to connect from Docker container to your host's PostgreSQL.

### 2. Start Services

#### Production Mode

```bash
docker-compose up -d
```

This starts:

- ✅ Next.js app (exposed on port 3000)
- ✅ PeerJS server (internal only, not exposed)

#### Development Mode

```bash
# Start only PeerJS (exposed on port 9000 for local dev)
docker-compose -f docker-compose.dev.yml up -d

# Run your app locally
pnpm dev
```

---

## 📦 Service Details

### Next.js Application

- **Container**: `vaibtalk-app`
- **Exposed Port**: 3000
- **Access**: http://localhost:3000
- **Database**: Connects to host PostgreSQL via `host.docker.internal`
- **PeerJS**: Connects to internal PeerJS container

### PeerJS Server

#### Production (`docker-compose.yml`)

- **Container**: `vaibtalk-peerjs`
- **Port**: 9000 (internal only)
- **Access**: Only accessible by Next.js container within Docker network
- **URL**: `http://peerjs:9000/peerjs` (internal)

#### Development (`docker-compose.dev.yml`)

- **Container**: `vaibtalk-peerjs-dev`
- **Port**: 9000 (exposed to host)
- **Access**: http://localhost:9000/peerjs
- **Purpose**: For local development with `pnpm dev`

### PostgreSQL Database

- **Location**: Your existing global container
- **Connection**: Via `host.docker.internal:5432`
- **Not managed by this Docker Compose**

---

## 🔧 Common Commands

### Using Makefile

```bash
make help         # Show all commands
make up           # Start production services
make down         # Stop services
make logs         # View all logs
make logs-app     # View app logs
make logs-peer    # View PeerJS logs
make rebuild      # Rebuild and restart
make health       # Check service health
```

### Using Docker Compose Directly

#### Production

```bash
docker-compose up -d              # Start
docker-compose down               # Stop
docker-compose logs -f app        # View app logs
docker-compose logs -f peerjs     # View PeerJS logs
docker-compose restart app        # Restart app
docker-compose up -d --build app  # Rebuild app
```

#### Development

```bash
docker-compose -f docker-compose.dev.yml up -d    # Start PeerJS
docker-compose -f docker-compose.dev.yml down     # Stop PeerJS
docker-compose -f docker-compose.dev.yml logs -f  # View logs
```

---

## 🔐 Database Connection

### From Docker Container (Production)

Your Next.js container connects to the host's PostgreSQL using:

```env
DATABASE_URL=postgresql://user:password@host.docker.internal:5432/vaibtalk?schema=public
```

The `host.docker.internal` hostname is automatically resolved to your host machine's IP.

### From Local Development

When running `pnpm dev` locally:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/vaibtalk?schema=public
```

---

## 🌐 Network Architecture

```
┌─────────────────────────────────────────────┐
│              Host Machine                    │
│                                              │
│  ┌──────────────────┐                       │
│  │   PostgreSQL     │ (Your existing        │
│  │   Container      │  global container)    │
│  │   Port 5432      │                       │
│  └────────▲─────────┘                       │
│           │                                  │
│           │ host.docker.internal             │
│           │                                  │
│  ┌────────┴──────────────────────────────┐  │
│  │    Docker Network (vaibtalk-network)  │  │
│  │                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Next.js    │  │   PeerJS     │  │  │
│  │  │     App      │──│   Server     │  │  │
│  │  │ Port 3000    │  │ Port 9000    │  │  │
│  │  │  (EXPOSED)   │  │  (INTERNAL)  │  │  │
│  │  └──────────────┘  └──────────────┘  │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
└─────────────────────────────────────────────┘

External Access:
  ✅ http://localhost:3000 → Next.js App
  ❌ PeerJS not accessible from outside
```

---

## 🎯 Development Workflows

### Workflow 1: Full Docker (Production-like)

```bash
# Start everything
make up

# Access app
open http://localhost:3000

# View logs
make logs-app

# Stop
make down
```

### Workflow 2: Hybrid Development (Recommended)

```bash
# Start only PeerJS
docker-compose -f docker-compose.dev.yml up -d

# Run app locally with hot-reload
pnpm dev

# Access app
open http://localhost:3000

# Stop PeerJS when done
docker-compose -f docker-compose.dev.yml down
```

### Workflow 3: Local Only (No Docker)

```bash
# Make sure you have PeerJS running somewhere
# Or install and run it globally

# Run app
pnpm dev
```

---

## 🔧 Troubleshooting

### Database Connection Issues

**Problem**: Can't connect to PostgreSQL from Docker container

**Solution**:

1. Verify your PostgreSQL is running:

   ```bash
   docker ps | grep postgres
   ```

2. Check if `host.docker.internal` works:

   ```bash
   docker-compose exec app ping host.docker.internal
   ```

3. Update `DATABASE_URL` in `.env`:

   ```env
   DATABASE_URL=postgresql://user:pass@host.docker.internal:5432/vaibtalk?schema=public
   ```

4. On Linux, you may need to use the host's IP instead:

   ```bash
   # Find your host IP
   ip addr show docker0 | grep inet

   # Use that IP in DATABASE_URL
   DATABASE_URL=postgresql://user:pass@172.17.0.1:5432/vaibtalk?schema=public
   ```

### PeerJS Connection Issues

**Problem**: WebRTC calls not working

**Solution**:

1. **In Production**: PeerJS is internal, your app should connect using the internal hostname:

   ```env
   NEXT_PUBLIC_PEER_SERVER_HOST=peerjs  # Internal Docker hostname
   NEXT_PUBLIC_PEER_SERVER_PORT=9000
   ```

2. **In Development**: PeerJS is exposed, use localhost:

   ```env
   NEXT_PUBLIC_PEER_SERVER_HOST=localhost
   NEXT_PUBLIC_PEER_SERVER_PORT=9000
   ```

3. Check PeerJS is running:
   ```bash
   make logs-peer
   ```

### App Won't Start

**Problem**: Application container fails to start

**Solution**:

1. Check logs:

   ```bash
   make logs-app
   ```

2. Verify database connection:

   ```bash
   docker-compose exec app sh
   # Inside container:
   ping host.docker.internal
   ```

3. Rebuild:
   ```bash
   make rebuild
   ```

---

## 🚀 Production Deployment

### 1. Update Environment Variables

```env
# Production database (adjust as needed)
DATABASE_URL=postgresql://user:pass@host.docker.internal:5432/vaibtalk?schema=public

# Production URLs
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<strong-secret>

# PeerJS will use internal Docker network
NEXT_PUBLIC_PEER_SERVER_HOST=yourdomain.com
NEXT_PUBLIC_PEER_SERVER_PORT=443  # Via reverse proxy
```

### 2. Deploy with Reverse Proxy

Since PeerJS is not exposed, you'll need a reverse proxy (nginx/traefik) to route traffic:

```nginx
# nginx example
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # Next.js app
    location / {
        proxy_pass http://localhost:3000;
    }

    # PeerJS (proxy to internal container)
    location /peerjs {
        proxy_pass http://localhost:9000;  # You'll need to expose this
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Note**: For production, you may want to expose PeerJS on a different port or use a reverse proxy.

### 3. Start Services

```bash
docker-compose up -d --build
```

---

## 📊 Service Health Checks

All services include health checks:

```bash
# Check all services
make health

# Check specific service
docker-compose ps peerjs
docker-compose ps app
```

---

## 🎓 Next Steps

1. **Configure your database connection** in `.env`
2. **Start services**: `make up` or `docker-compose up -d`
3. **Verify health**: `make health`
4. **Access app**: http://localhost:3000

For development:

```bash
docker-compose -f docker-compose.dev.yml up -d
pnpm dev
```

---

## 📚 Additional Resources

- **README.md** - Project documentation
- **Makefile** - Run `make help` for all available commands

---

## ✅ Summary

**What's Exposed**:

- ✅ Next.js App (Port 3000)

**What's Internal**:

- ❌ PeerJS Server (Port 9000 - internal only in production)

**What's External**:

- ❌ PostgreSQL (Using your existing container)

This configuration provides:

- **Security**: Only necessary ports exposed
- **Flexibility**: Use existing PostgreSQL
- **Simplicity**: Minimal Docker footprint
- **Development**: Easy local development with PeerJS exposed

Happy coding! 🚀
