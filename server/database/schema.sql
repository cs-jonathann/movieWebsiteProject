-- Database Schema for Movie Streaming Website

-- Users table (minimal for authentication)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content table (pre-seeded, read-only for users)
CREATE TABLE content (
  id SERIAL PRIMARY KEY,
  tmdb_id INTEGER UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('movie', 'tv_show')) NOT NULL,
  poster_url VARCHAR(500),
  release_year INTEGER,
  genre VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Watchlist table (main feature with UPDATE capability)
CREATE TABLE watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content_id INTEGER REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  watched BOOLEAN DEFAULT FALSE,
  notes TEXT,
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);


-- Watch progress table (tracks where users left off)
CREATE TABLE IF NOT EXISTS watch_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content_id INTEGER REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  progress_seconds INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  last_watched TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_watch_progress_user ON watch_progress(user_id, last_watched DESC);
