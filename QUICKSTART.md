# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start the System
```bash
docker-compose up --build
```

Wait for all services to start (about 30-60 seconds). You should see logs from all services.

### Step 2: Test Event Ingestion
Run the included test script:
```bash
./test.sh
```

Or manually test with curl:
```bash
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "my-site",
    "event_type": "page_view",
    "path": "/home",
    "user_id": "user-123",
    "timestamp": "2025-11-14T12:00:00Z"
  }'
```

### Step 3: View Statistics
```bash
curl "http://localhost:4000/stats?site_id=my-site&date=2025-11-14"
```

## 📋 Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# API only
docker-compose logs -f api

# Worker only
docker-compose logs -f worker
```

### Check Container Status
```bash
docker-compose ps
```

### Stop System
```bash
# Stop services (keeps data)
docker-compose down

# Stop and remove data
docker-compose down -v
```

### Database Access
```bash
# Connect to PostgreSQL
docker exec -it analytics-postgres psql -U analytics_user -d analytics

# View events
docker exec -it analytics-postgres psql -U analytics_user -d analytics -c "SELECT * FROM events LIMIT 10;"

# Count events
docker exec -it analytics-postgres psql -U analytics_user -d analytics -c "SELECT COUNT(*) FROM events;"
```

### Redis Queue Monitoring
```bash
# Connect to Redis CLI
docker exec -it analytics-redis redis-cli

# Check queue length
docker exec -it analytics-redis redis-cli LLEN bull:analytics-events:wait
```

## 🔍 Troubleshooting

### Problem: Port already in use
```bash
# Find what's using port 4000
lsof -i :4000

# Kill the process or change API_PORT in .env
```

### Problem: Services not starting
```bash
# Check Docker is running
docker --version

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### Problem: Events not appearing in stats
```bash
# Check worker is running
docker-compose ps worker

# Check worker logs
docker-compose logs worker

# Check database
docker exec -it analytics-postgres psql -U analytics_user -d analytics -c "SELECT COUNT(*) FROM events;"
```

## 📊 Performance Testing

### Load Test with Apache Bench
```bash
# Install ab (apache bench) if needed
# brew install apache-bench (macOS)
# apt-get install apache2-utils (Linux)

# Test ingestion endpoint (1000 requests, 10 concurrent)
ab -n 1000 -c 10 -p event.json -T application/json http://localhost:4000/event
```

Create `event.json`:
```json
{
  "site_id": "load-test",
  "event_type": "page_view",
  "path": "/test",
  "user_id": "load-user",
  "timestamp": "2025-11-14T12:00:00Z"
}
```

### Monitor Queue Processing
```bash
# Watch worker logs in real-time
docker-compose logs -f worker | grep "Processing event"
```

## 🎯 Example Scenarios

### E-commerce Site Tracking
```bash
# Product page view
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "shop-001",
    "event_type": "page_view",
    "path": "/products/laptop-123",
    "user_id": "customer-456",
    "timestamp": "2025-11-14T14:30:00Z"
  }'

# Add to cart event
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "shop-001",
    "event_type": "add_to_cart",
    "path": "/cart",
    "user_id": "customer-456",
    "timestamp": "2025-11-14T14:35:00Z"
  }'
```

### Blog Analytics
```bash
# Article view
curl -X POST http://localhost:4000/event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "blog-xyz",
    "event_type": "page_view",
    "path": "/article/nodejs-performance",
    "user_id": "reader-789",
    "timestamp": "2025-11-14T09:15:00Z"
  }'
```

## ✅ Validation Checklist

- [ ] `docker-compose up --build` starts without errors
- [ ] `curl http://localhost:4000/health` returns `{"status":"healthy"}`
- [ ] POST /event returns 202 with jobId
- [ ] Worker logs show "Event inserted successfully"
- [ ] GET /stats returns aggregated data
- [ ] Database contains events: `docker exec -it analytics-postgres psql -U analytics_user -d analytics -c "SELECT COUNT(*) FROM events;"`

## 🔗 Additional Resources

- Full documentation: See [README.md](README.md)
- Docker Compose docs: https://docs.docker.com/compose/
- Bull Queue docs: https://github.com/OptimalBits/bull

---

**Need help?** Check the main README.md or review docker-compose logs.
