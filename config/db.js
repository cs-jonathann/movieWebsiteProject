// server/config/db.js

// Grab the Pool class from the pg library so we can talk to PostgreSQL
const { Pool } = require("pg");

// Prefer a single DATABASE_URL if it's set (Railway style).
// Otherwise fall back to individual DB_* env vars for local dev.
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}` +
    `@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Create the connection pool
const pool = new Pool({
  connectionString,
  // Railway uses SSL; this keeps Node from complaining
  ssl:
    process.env.NODE_ENV === "production" || process.env.FORCE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});

module.exports = pool;
