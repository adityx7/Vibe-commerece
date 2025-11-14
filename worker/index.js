const Bull = require('bull');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration
const QUEUE_NAME = process.env.QUEUE_NAME || 'analytics-events';
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY) || 5;

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
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Bull queue
const eventQueue = new Bull(QUEUE_NAME, {
  redis: redisConfig,
});

// Logging utilities
const log = {
  info: (message, data = {}) => console.log(JSON.stringify({ level: 'info', message, ...data, timestamp: new Date().toISOString() })),
  error: (message, data = {}) => console.error(JSON.stringify({ level: 'error', message, ...data, timestamp: new Date().toISOString() })),
  warn: (message, data = {}) => console.warn(JSON.stringify({ level: 'warn', message, ...data, timestamp: new Date().toISOString() })),
  debug: (message, data = {}) => console.log(JSON.stringify({ level: 'debug', message, ...data, timestamp: new Date().toISOString() })),
};

// Process jobs from the queue
eventQueue.process(WORKER_CONCURRENCY, async (job) => {
  const { site_id, event_type, path, user_id, timestamp } = job.data;
  
  log.info('Processing event', {
    jobId: job.id,
    site_id,
    event_type,
    path,
    user_id: user_id || 'anonymous',
  });
  
  try {
    // Insert event into PostgreSQL using parameterized query to prevent SQL injection
    const query = `
      INSERT INTO events (site_id, event_type, path, user_id, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    
    const values = [
      site_id,
      event_type,
      path,
      user_id || null,
      timestamp,
    ];
    
    const result = await pgPool.query(query, values);
    const insertedId = result.rows[0].id;
    
    log.info('Event inserted successfully', {
      jobId: job.id,
      eventId: insertedId,
      site_id,
      event_type,
    });
    
    return { success: true, eventId: insertedId };
  } catch (error) {
    log.error('Failed to insert event', {
      jobId: job.id,
      error: error.message,
      stack: error.stack,
      site_id,
      event_type,
    });
    
    // Throw error to trigger retry mechanism
    throw error;
  }
});

// Event listeners for queue monitoring
eventQueue.on('completed', (job, result) => {
  log.info('Job completed', {
    jobId: job.id,
    eventId: result.eventId,
  });
});

eventQueue.on('failed', (job, err) => {
  log.error('Job failed', {
    jobId: job.id,
    attempt: job.attemptsMade,
    maxAttempts: job.opts.attempts,
    error: err.message,
    data: job.data,
  });
  
  // Log if job has exhausted all retries
  if (job.attemptsMade >= job.opts.attempts) {
    log.error('Job exhausted all retries', {
      jobId: job.id,
      data: job.data,
      finalError: err.message,
    });
  }
});

eventQueue.on('stalled', (job) => {
  log.warn('Job stalled', {
    jobId: job.id,
    data: job.data,
  });
});

eventQueue.on('error', (error) => {
  log.error('Queue error', {
    error: error.message,
    stack: error.stack,
  });
});

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    const result = await pgPool.query('SELECT NOW()');
    log.info('Database connection successful', { timestamp: result.rows[0].now });
    return true;
  } catch (error) {
    log.error('Database connection failed', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Graceful shutdown
async function shutdown() {
  log.info('Shutting down worker gracefully');
  
  try {
    // Close the queue (wait for active jobs to complete)
    await eventQueue.close(5000); // Wait up to 5 seconds for jobs to finish
    log.info('Queue closed');
    
    // Close database pool
    await pgPool.end();
    log.info('Database pool closed');
    
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Initialize worker
(async () => {
  try {
    log.info('Starting analytics worker', {
      queueName: QUEUE_NAME,
      concurrency: WORKER_CONCURRENCY,
      redisHost: redisConfig.host,
      redisPort: redisConfig.port,
    });
    
    // Test database connection
    await testDatabaseConnection();
    
    log.info('Worker is ready to process jobs');
  } catch (error) {
    log.error('Failed to start worker', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
})();
