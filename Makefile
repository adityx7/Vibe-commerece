.PHONY: help start stop restart logs test clean build status db-console redis-console

help: ## Show this help message
	@echo "Analytics System - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

start: ## Start all services (build if needed)
	docker-compose up --build

start-detached: ## Start all services in background
	docker-compose up --build -d

stop: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-api: ## View API service logs
	docker-compose logs -f api

logs-worker: ## View worker service logs
	docker-compose logs -f worker

test: ## Run test script
	./test.sh

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v

build: ## Rebuild all Docker images
	docker-compose build --no-cache

status: ## Show status of all services
	docker-compose ps

health: ## Check API health
	@curl -s http://localhost:4000/health | jq . || curl -s http://localhost:4000/health

db-console: ## Connect to PostgreSQL console
	docker exec -it analytics-postgres psql -U analytics_user -d analytics

db-query: ## Run a query on the database (usage: make db-query QUERY="SELECT COUNT(*) FROM events;")
	docker exec -it analytics-postgres psql -U analytics_user -d analytics -c "$(QUERY)"

db-events: ## Show recent events from database
	docker exec -it analytics-postgres psql -U analytics_user -d analytics -c "SELECT * FROM events ORDER BY created_at DESC LIMIT 10;"

db-count: ## Count total events in database
	docker exec -it analytics-postgres psql -U analytics_user -d analytics -c "SELECT COUNT(*) as total_events FROM events;"

redis-console: ## Connect to Redis CLI
	docker exec -it analytics-redis redis-cli

queue-length: ## Check queue length
	docker exec -it analytics-redis redis-cli LLEN bull:analytics-events:wait

ingest-sample: ## Ingest a sample event
	@curl -X POST http://localhost:4000/event \
	  -H "Content-Type: application/json" \
	  -d '{"site_id":"demo","event_type":"page_view","path":"/test","user_id":"test-user","timestamp":"'$$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
	@echo ""

stats-demo: ## Get stats for demo site (today)
	@curl -s "http://localhost:4000/stats?site_id=demo&date=$$(date +%Y-%m-%d)" | jq . || curl -s "http://localhost:4000/stats?site_id=demo&date=$$(date +%Y-%m-%d)"

dev-setup: ## Setup development environment
	@echo "Installing dependencies..."
	cd api && npm install
	cd worker && npm install
	@echo "Development setup complete!"

lint: ## Lint JavaScript files (requires eslint)
	@echo "Linting API..."
	cd api && npx eslint . || echo "ESLint not installed, skipping..."
	@echo "Linting Worker..."
	cd worker && npx eslint . || echo "ESLint not installed, skipping..."

reset: clean start ## Clean restart (removes all data)

backup-db: ## Backup database to file
	docker exec analytics-postgres pg_dump -U analytics_user analytics > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Database backed up to backup_$$(date +%Y%m%d_%H%M%S).sql"

monitor: ## Monitor system resources
	@echo "Container resource usage:"
	docker stats --no-stream analytics-api analytics-worker analytics-postgres analytics-redis
