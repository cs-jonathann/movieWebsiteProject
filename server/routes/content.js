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
    const result = await pool.query(
      `
      SELECT *
      FROM content
      ORDER BY created_at DESC
      LIMIT 300
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Content fetch error:", err); // 👈 full error in server terminal

    // TEMPORARY: expose details so we can see in the browser too
    res.status(500).json({
      error: "Failed to fetch content",
      details: err.message, // <- this is the key line
      code: err.code || null, // optional but helpful
    });
  }
});

module.exports = router;
