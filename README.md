# Analytics Ingestion & Reporting System

A high-performance analytics system with fast event ingestion, background processing, and comprehensive reporting capabilities. Built with Node.js, Express, Bull (Redis queue), and PostgreSQL.

## 🏗️ Architecture

- **API Service**: Express server handling event ingestion and statistics reporting
- **Worker Service**: Background job processor for database persistence
- **Redis**: Message queue for asynchronous event processing
- **PostgreSQL**: Persistent storage with optimized indexes

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Ports 4000 (API), 5432 (PostgreSQL), and 6379 (Redis) available

### Start the System

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>

# Start all services
docker-compose up --build
```

The system will:
1. Start Redis and PostgreSQL containers
2. Initialize the database schema from `db/init.sql`
3. Launch the API service on port 4000
4. Start the background worker for event processing

### Verify Services

```bash
# Check API health
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "analytics-api"
}
```

## 📡 API Endpoints

### 1. POST /event - Enqueue Analytics Event

Accepts an analytics event and enqueues it for background processing. Returns immediately (202 Accepted).

**Request:**
```bash
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "website-001",
    "event_type": "page_view",
    "path": "/home",
    "user_id": "user-123",
    "timestamp": "2025-11-14T10:30:00Z"
  }'
```

**Response (202 Accepted):**
```json
{
  "message": "Event accepted for processing",
  "jobId": "website-001-1731582600000-abc123xyz"
}
```

**Validation Rules:**
- `site_id` (required): Non-empty string
- `event_type` (required): Non-empty string (e.g., "page_view", "click")
- `path` (required): Non-empty string (URL path)
- `user_id` (optional): String identifier for user tracking
- `timestamp` (required): ISO 8601 date string (e.g., "2025-11-14T10:30:00Z")

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid payload",
  "details": [
    "timestamp must be a valid ISO 8601 date string"
  ]
}
```

### 2. GET /stats - Retrieve Analytics Statistics

Fetches aggregated analytics for a specific site and date.

**Request:**
```bash
# Get stats for today
curl "http://localhost:4000/stats?site_id=website-001"

# Get stats for specific date
curl "http://localhost:4000/stats?site_id=website-001&date=2025-11-14"
```

**Response (200 OK):**
```json
{
  "site_id": "website-001",
  "date": "2025-11-14",
  "total_views": 150,
  "unique_users": 45,
  "top_paths": [
    { "path": "/home", "views": 75 },
    { "path": "/products", "views": 40 },
    { "path": "/about", "views": 20 },
    { "path": "/contact", "views": 15 }
  ]
}
```

**Query Parameters:**
- `site_id` (required): Site identifier
- `date` (optional): Date in YYYY-MM-DD format (defaults to today)

**Error Response (400 Bad Request):**
```json
{
  "error": "site_id query parameter is required"
}
```

## 🧪 Example Usage & Testing

### Scenario 1: Single Event Ingestion

```bash
# Ingest a page view event
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "demo-site",
    "event_type": "page_view",
    "path": "/landing",
    "user_id": "user-001",
    "timestamp": "2025-11-14T12:00:00Z"
  }'
```

### Scenario 2: Multiple Events with Different Users and Paths

```bash
# Event 1: User 001 views home page
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "demo-site",
    "event_type": "page_view",
    "path": "/home",
    "user_id": "user-001",
    "timestamp": "2025-11-14T12:00:00Z"
  }'

# Event 2: User 002 views products page
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "demo-site",
    "event_type": "page_view",
    "path": "/products",
    "user_id": "user-002",
    "timestamp": "2025-11-14T12:05:00Z"
  }'

# Event 3: User 001 views products page
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "demo-site",
    "event_type": "page_view",
    "path": "/products",
    "user_id": "user-001",
    "timestamp": "2025-11-14T12:10:00Z"
  }'

# Event 4: Anonymous user views home page
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "demo-site",
    "event_type": "page_view",
    "path": "/home",
    "timestamp": "2025-11-14T12:15:00Z"
  }'

# Event 5: User 003 views about page
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "demo-site",
    "event_type": "page_view",
    "path": "/about",
    "user_id": "user-003",
    "timestamp": "2025-11-14T12:20:00Z"
  }'
```

### Scenario 3: Fetch Statistics

```bash
# Wait a few seconds for background processing, then fetch stats
sleep 5

curl "http://localhost:4000/stats?site_id=demo-site&date=2025-11-14"
```

Expected output:
```json
{
  "site_id": "demo-site",
  "date": "2025-11-14",
  "total_views": 5,
  "unique_users": 3,
  "top_paths": [
    { "path": "/home", "views": 2 },
    { "path": "/products", "views": 2 },
    { "path": "/about", "views": 1 }
  ]
}
```

## ✅ Verification Checklist

### 1. System Startup
- [ ] All containers start successfully: `docker-compose ps`
- [ ] API service is healthy: `curl http://localhost:4000/health`
- [ ] No errors in logs: `docker-compose logs api worker`

### 2. Event Ingestion
- [ ] POST /event returns 202 Accepted status
- [ ] Response includes a jobId
- [ ] Invalid payloads return 400 with error details

### 3. Background Processing
- [ ] Worker logs show "Processing event" messages
- [ ] Worker logs show "Event inserted successfully" messages
- [ ] No repeated failures in worker logs

### 4. Database Persistence
```bash
# Connect to PostgreSQL and verify data
docker exec -it analytics-postgres psql -U analytics_user -d analytics -c "SELECT COUNT(*) FROM events;"
```
- [ ] Events count matches number of POSTed events

### 5. Reporting Endpoint
- [ ] GET /stats returns 200 OK with correct aggregations
- [ ] total_views matches the count of page_view events
- [ ] unique_users counts distinct user_id values (excludes null)
- [ ] top_paths are ordered by view count (descending)
- [ ] Missing site_id returns 400 error

### 6. Performance
- [ ] POST /event responds in < 100ms (fast enqueue)
- [ ] Multiple concurrent requests handled without errors
- [ ] Worker processes jobs within 1-2 seconds

## 🔧 Configuration

All configuration is managed through environment variables. See `.env.example` for available options:

```bash
# Copy example environment file
cp .env.example .env

# Edit as needed
nano .env
```

### Key Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | 4000 | API service port |
| `POSTGRES_DB` | analytics | Database name |
| `POSTGRES_USER` | analytics_user | Database user |
| `POSTGRES_PASSWORD` | analytics_pass | Database password |
| `QUEUE_NAME` | analytics-events | Redis queue name |
| `WORKER_CONCURRENCY` | 5 | Number of concurrent jobs |

## 📊 Database Schema

### Events Table

```sql
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    site_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    path TEXT NOT NULL,
    user_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

- `idx_events_site_date`: Optimizes date-range queries
- `idx_events_site_path`: Optimizes path aggregation
- `idx_events_site_user`: Optimizes unique user counting
- `idx_events_site_timestamp`: General site/time queries

## 🐳 Docker Services

### API Service
- **Port**: 4000
- **Dependencies**: Redis, PostgreSQL
- **Restart Policy**: unless-stopped

### Worker Service
- **Dependencies**: Redis, PostgreSQL
- **Concurrency**: 5 jobs (configurable)
- **Restart Policy**: unless-stopped

### PostgreSQL
- **Port**: 5432
- **Volume**: Persistent storage
- **Health Check**: Included

### Redis
- **Port**: 6379
- **Health Check**: Included

## 🛠️ Development

### Local Development (without Docker)

```bash
# Start Redis and PostgreSQL locally
# Update .env with local connection details

# API service
cd api
npm install
npm run dev

# Worker service (in another terminal)
cd worker
npm install
npm run dev
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f worker
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v
```

## 🔍 Troubleshooting

### Issue: Events not appearing in stats

**Solution:**
1. Check worker logs: `docker-compose logs worker`
2. Verify worker is processing jobs successfully
3. Ensure timestamp date matches the query date
4. Check database: `docker exec -it analytics-postgres psql -U analytics_user -d analytics -c "SELECT * FROM events LIMIT 5;"`

### Issue: API not responding

**Solution:**
1. Check API logs: `docker-compose logs api`
2. Verify port 4000 is not in use: `lsof -i :4000`
3. Restart API service: `docker-compose restart api`

### Issue: Worker failing to connect to database

**Solution:**
1. Check PostgreSQL health: `docker-compose ps postgres`
2. Verify database credentials in docker-compose.yml
3. Restart services: `docker-compose restart worker postgres`

## 📝 Performance Considerations

- **Ingestion**: Sub-100ms response time (enqueue-only, no DB writes)
- **Background Processing**: Configurable concurrency (default: 5 jobs)
- **Reporting Queries**: Optimized with indexes on site_id, date, path, and user_id
- **Queue Management**: Auto-cleanup of completed/failed jobs to prevent memory growth

## 🔒 Security Notes

- Uses parameterized queries to prevent SQL injection
- Environment variables for sensitive configuration
- Non-root Docker user for services
- Health checks for service monitoring

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please ensure all tests pass and follow the existing code style.

---

**Built with ❤️ using Node.js, Express, Bull, Redis, and PostgreSQL**
