// loading pg Library, PostgreSQL client for Node.js. pg Library exports a bunch of stuff and one of them is Pool
// Simple Terms: Grab the Pool tool from the pg library so we can talk to PostgreSQL.
const { Pool } = require("pg");

// Simple terms: if Railway gives us a single DATABASE_URL string, use that.
// Otherwise, fall back to the separate DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD vars
const connectionString = process.env.DATABASE_URL;

let pool;

if (connectionString) {
  // ⭐ Production / Railway path:
  // Use the full connection string from DATABASE_URL (includes host, db name, user, pw, port)
  pool = new Pool({
    connectionString,
    // Many hosted Postgres providers (including Railway) require SSL
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  // ⭐ Local development path (what you had before)
  // This tells pg: “Create a pool of database connections using these settings (host, port, db name, user, password).”
  pool = new Pool({
    // process.env is an object that holds all environmental values.

    // Use the DB host value from the .env file. host: tells postgres where the database server is running.
    host: process.env.DB_HOST || "localhost",

    // Use the DB port from .env (probably 5432)
    port: process.env.DB_PORT || 5432,

    // Connecting specifically to the moviewebsite database.
    database: process.env.DB_NAME,

    // This is the Postgres username to log in as.
    user: process.env.DB_USER,

    // PW for the Postgres user
    password: process.env.DB_PASSWORD,
  });
}

// exporting so other files can use it.
module.exports = pool;
