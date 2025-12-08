// server/routes/content.js

// bringing in express so we can create routes
const express = require("express");

// Bring in your database connection (pool) so we can run SQL queries.
const pool = require("../config/db");

// Make a mini “router” object that holds routes for /api/content.
const router = express.Router();

// GET /api/content  -> list all content
router.get("/", async (req, res) => {
  try {
    // asking Postrges for a list of rows from the content table. newest content will be first (ORDER BY...)
    const result = await pool.query(
      `
      SELECT
        id,
        title,
        type,
        poster_url,
        release_year,
        genre,
        imdb_id,
        tmdb_id,
      FROM content
      ORDER BY id
      `
    );
    // results.row is an array of content objects from the DB. Sending array back to the client as a JSON
    res.json(result.rows);
  } catch (err) {
    // if anything fails then error
    console.error("Content fetch error:", err);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

module.exports = router;
