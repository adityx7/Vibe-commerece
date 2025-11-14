-- Analytics Events Table
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    site_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    path TEXT NOT NULL,
    user_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization

-- Index for filtering by site_id and date range (used in reporting queries)
CREATE INDEX idx_events_site_date ON events (site_id, DATE(timestamp));

-- Index for site_id and path aggregation (top paths query)
CREATE INDEX idx_events_site_path ON events (site_id, path);

-- Index for unique user counting per site
CREATE INDEX idx_events_site_user ON events (site_id, user_id);

-- Composite index for efficient stats queries
CREATE INDEX idx_events_site_timestamp ON events (site_id, timestamp);

-- Comments for documentation
COMMENT ON TABLE events IS 'Stores all analytics events from various sites';
COMMENT ON COLUMN events.site_id IS 'Identifier for the website/application';
COMMENT ON COLUMN events.event_type IS 'Type of event (e.g., page_view, click)';
COMMENT ON COLUMN events.path IS 'URL path or resource identifier';
COMMENT ON COLUMN events.user_id IS 'Optional user identifier for tracking unique users';
COMMENT ON COLUMN events.timestamp IS 'Event occurrence timestamp (timezone-aware)';
COMMENT ON COLUMN events.created_at IS 'Record creation timestamp in database';
