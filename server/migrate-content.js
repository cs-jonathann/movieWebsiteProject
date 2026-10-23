require("dotenv").config();
const pool = require("./config/db");

// Brings an existing content table up to date with database/schema.sql
// (schema.sql only works on an empty database). Safe to run more than once.
async function migrateContent() {
  try {
    // columns added after the first version of the table
    await pool.query(`
      ALTER TABLE content
        ADD COLUMN IF NOT EXISTS imdb_id VARCHAR(20),
        ADD COLUMN IF NOT EXISTS backdrop_url VARCHAR(500),
        ADD COLUMN IF NOT EXISTS overview TEXT,
        ADD COLUMN IF NOT EXISTS rating REAL,
        ADD COLUMN IF NOT EXISTS popularity REAL;
    `);

    // TMDB movie ids and tv ids overlap, so tmdb_id alone can't be unique.
    // swap UNIQUE(tmdb_id) for UNIQUE(tmdb_id, type)
    await pool.query(
      "ALTER TABLE content DROP CONSTRAINT IF EXISTS content_tmdb_id_key;"
    );
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'content_tmdb_id_type_key'
        ) THEN
          ALTER TABLE content
            ADD CONSTRAINT content_tmdb_id_type_key UNIQUE (tmdb_id, type);
        END IF;
      END $$;
    `);

    console.log("✅ content table migrated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error migrating content table:", err);
    process.exit(1);
  }
}

migrateContent();
