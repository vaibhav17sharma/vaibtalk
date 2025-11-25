.PHONY: help build up down restart logs clean rebuild dev prod migrate studio shell ps health

# Default target
help:
	@echo "VaibTalk Docker Commands"
	@echo "========================"
	@echo "make build      - Build all Docker images"
	@echo "make up         - Start all services (Next.js + PeerJS)"
	@echo "make down       - Stop all services"
	@echo "make restart    - Restart all services"
	@echo "make logs       - View logs from all services"
	@echo "make logs-app   - View application logs"
	@echo "make logs-peer  - View PeerJS server logs"
	@echo "make clean      - Stop services and remove volumes"
	@echo "make rebuild    - Rebuild and restart all services"
	@echo "make dev        - Start services in development mode"
	@echo "make dev-peer   - Start only PeerJS for local development"
	@echo "make prod       - Start services in production mode"
	@echo "make migrate    - Run database migrations"
	@echo "make studio     - Open Prisma Studio"
	@echo "make shell      - Access application container shell"
	@echo "make ps         - Show running containers"
	@echo "make health     - Check service health"

# Build all images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Restart all services
restart:
	docker-compose restart

# View logs from all services
logs:
	docker-compose logs -f

# View application logs
logs-app:
	docker-compose logs -f app

# View PeerJS logs
logs-peer:
	docker-compose logs -f peerjs

# Stop and remove volumes
clean:
	@echo "⚠️  WARNING: This will stop all services!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
	fi

# Rebuild and restart
rebuild:
	docker-compose up -d --build

# Development mode (foreground)
dev:
	docker-compose up

# Start only PeerJS for local development
dev-peer:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ PeerJS started on http://localhost:9000/peerjs"
	@echo "Now run: pnpm dev"

# Stop development PeerJS
dev-peer-down:
	docker-compose -f docker-compose.dev.yml down

# Production mode
prod:
	docker-compose up -d

# Run database migrations
migrate:
	docker-compose exec app npx prisma migrate deploy

# Open Prisma Studio
studio:
	docker-compose exec app npx prisma studio

# Access application shell
shell:
	docker-compose exec app sh

# Show running containers
ps:
	docker-compose ps

# Check service health
health:
	@echo "Checking service health..."
	@docker-compose ps
	@echo ""
	@echo "PeerJS:"
	@docker-compose exec peerjs wget -q --spider http://localhost:9000/peerjs && echo "✅ PeerJS is running" || echo "❌ PeerJS not ready"
	@echo ""
	@echo "Application:"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Application is running" || echo "❌ Application not ready"
	@echo ""
	@echo "Note: PostgreSQL is managed externally"
