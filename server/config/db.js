// loading pg Library, PostgreSQL client for Node.js. pg Library exports a bunch of stuff and one of them is Pool
// Simple Terms: Grab the Pool tool from the pg library so we can talk to PostgreSQL.
const { Pool } = require("pg");

// This tells pg: “Create a pool of database connections using these settings (host, port, db name, user, password).”
const pool = new Pool({
  // process.env is an object that holds all environmental values.

  // Use the DB host value from the .env file. host: tells postgres where the database server is running.
  host: process.env.DB_HOST,

  // Use the DB port from .env (probably 5432)
  port: process.env.DB_PORT,

  // Connecting specifically to the moviewebsite database.
  database: process.env.DB_NAME,

  // This is the Postgres username to log in as.
  user: process.env.DB_USER,

  // PW for the Postgres user
  password: process.env.DB_PASSWORD,
});

// exporting so other files can use it.
module.exports = pool;
