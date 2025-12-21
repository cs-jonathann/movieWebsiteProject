require("dotenv").config();
const pool = require("./config/db");

async function addProgressTable() {
  try {
    // Only create the watch_progress table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS watch_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        content_id INTEGER REFERENCES content(id) ON DELETE CASCADE NOT NULL,
        progress_seconds INTEGER DEFAULT 0,
        duration_seconds INTEGER DEFAULT 0,
        last_watched TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, content_id)
      );
    `);

    // Create index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_watch_progress_user 
      ON watch_progress(user_id, last_watched DESC);
    `);

    console.log("✅ watch_progress table created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating watch_progress table:", err);
    process.exit(1);
  }
}

addProgressTable();
