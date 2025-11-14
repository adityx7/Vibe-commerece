const express = require('express');
const Bull = require('bull');
const { Pool } = require('pg');
require('dotenv').config();

// Initialize Express app
const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 4000;
const QUEUE_NAME = process.env.QUEUE_NAME || 'analytics-events';

// Redis configuration for Bull
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
};

// PostgreSQL pool configuration
const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DB || 'analytics',
  user: process.env.POSTGRES_USER || 'analytics_user',
  password: process.env.POSTGRES_PASSWORD || 'analytics_pass',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Bull queue
const eventQueue = new Bull(QUEUE_NAME, {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Logging utilities
const log = {
  info: (message, data = {}) => console.log(JSON.stringify({ level: 'info', message, ...data, timestamp: new Date().toISOString() })),
  error: (message, data = {}) => console.error(JSON.stringify({ level: 'error', message, ...data, timestamp: new Date().toISOString() })),
  warn: (message, data = {}) => console.warn(JSON.stringify({ level: 'warn', message, ...data, timestamp: new Date().toISOString() })),
};

// Validation helper
function validateEventPayload(payload) {
  const errors = [];
  
  if (!payload.site_id || typeof payload.site_id !== 'string' || payload.site_id.trim() === '') {
    errors.push('site_id is required and must be a non-empty string');
  }
  
  if (!payload.event_type || typeof payload.event_type !== 'string' || payload.event_type.trim() === '') {
    errors.push('event_type is required and must be a non-empty string');
  }
  
  if (!payload.path || typeof payload.path !== 'string' || payload.path.trim() === '') {
    errors.push('path is required and must be a non-empty string');
  }
  
  if (payload.user_id !== undefined && payload.user_id !== null && typeof payload.user_id !== 'string') {
    errors.push('user_id must be a string if provided');
  }
  
  if (!payload.timestamp || typeof payload.timestamp !== 'string') {
    errors.push('timestamp is required and must be an ISO 8601 string');
  } else {
    const date = new Date(payload.timestamp);
    if (isNaN(date.getTime())) {
      errors.push('timestamp must be a valid ISO 8601 date string');
    }
  }
  
  return errors;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'analytics-api' });
});

// POST /event - Enqueue analytics event
app.post('/event', async (req, res) => {
  try {
    const payload = req.body;
    
    // Validate payload
    const validationErrors = validateEventPayload(payload);
    if (validationErrors.length > 0) {
      log.warn('Invalid event payload', { errors: validationErrors, payload });
      return res.status(400).json({
        error: 'Invalid payload',
        details: validationErrors,
      });
    }
    
    // Enqueue job to Bull
    const job = await eventQueue.add(payload, {
      jobId: `${payload.site_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });
    
    log.info('Event enqueued', { jobId: job.id, site_id: payload.site_id, event_type: payload.event_type });
    
    // Return 202 Accepted immediately
    res.status(202).json({
      message: 'Event accepted for processing',
      jobId: job.id,
    });
  } catch (error) {
    log.error('Failed to enqueue event', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to enqueue event',
      message: error.message,
    });
  }
});

// GET /stats - Retrieve analytics statistics
app.get('/stats', async (req, res) => {
  try {
    const { site_id, date } = req.query;
    
    // Validate required parameters
    if (!site_id) {
      return res.status(400).json({
        error: 'site_id query parameter is required',
      });
    }
    
    // Use provided date or default to today
    let targetDate;
    if (date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          error: 'date must be in YYYY-MM-DD format',
        });
      }
      targetDate = date;
    } else {
      // Default to today in UTC
      targetDate = new Date().toISOString().split('T')[0];
    }
    
    log.info('Fetching stats', { site_id, date: targetDate });
    
    // Query total views
    const totalViewsQuery = `
      SELECT COUNT(*) as total_views
      FROM events
      WHERE site_id = $1
        AND DATE(timestamp) = $2
        AND event_type = 'page_view'
    `;
    
    // Query unique users
    const uniqueUsersQuery = `
      SELECT COUNT(DISTINCT user_id) as unique_users
      FROM events
      WHERE site_id = $1
        AND DATE(timestamp) = $2
        AND user_id IS NOT NULL
    `;
    
    // Query top paths
    const topPathsQuery = `
      SELECT path, COUNT(*) as views
      FROM events
      WHERE site_id = $1
        AND DATE(timestamp) = $2
        AND event_type = 'page_view'
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `;
    
    // Execute queries in parallel
    const [totalViewsResult, uniqueUsersResult, topPathsResult] = await Promise.all([
      pgPool.query(totalViewsQuery, [site_id, targetDate]),
      pgPool.query(uniqueUsersQuery, [site_id, targetDate]),
      pgPool.query(topPathsQuery, [site_id, targetDate]),
    ]);
    
    // Format response
    const response = {
      site_id,
      date: targetDate,
      total_views: parseInt(totalViewsResult.rows[0].total_views),
      unique_users: parseInt(uniqueUsersResult.rows[0].unique_users),
      top_paths: topPathsResult.rows.map(row => ({
        path: row.path,
        views: parseInt(row.views),
      })),
    };
    
    log.info('Stats retrieved successfully', { site_id, date: targetDate, total_views: response.total_views });
    
    res.json(response);
  } catch (error) {
    log.error('Failed to retrieve stats', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  log.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('SIGTERM received, shutting down gracefully');
  await eventQueue.close();
  await pgPool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log.info('SIGINT received, shutting down gracefully');
  await eventQueue.close();
  await pgPool.end();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  log.info('API server started', { port: PORT });
});
