const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET /api/content?page=1&limit=24&search=batman
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    // capped so one request can't ask for an unlimited number of rows
    const limit = Math.min(parseInt(req.query.limit, 10) || 24, 1000);
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || "";

    let query;
    let countQuery;
    let queryParams;
    let countParams;

    // If there's a search term, filter by title
    if (searchTerm) {
      query = `
        SELECT *
        FROM content
        WHERE LOWER(title) LIKE LOWER($1)
        ORDER BY release_year DESC, id
        LIMIT $2 OFFSET $3
      `;
      queryParams = [`%${searchTerm}%`, limit, offset];

      countQuery = `
        SELECT COUNT(*)
        FROM content
        WHERE LOWER(title) LIKE LOWER($1)
      `;
      countParams = [`%${searchTerm}%`];
    } else {
      // No search term, return all content (most popular first)
      query = `
        SELECT *
        FROM content
        ORDER BY popularity DESC NULLS LAST, id
        LIMIT $1 OFFSET $2
      `;
      queryParams = [limit, offset];

      countQuery = "SELECT COUNT(*) FROM content";
      countParams = [];
    }

    // Execute queries
    const itemsResult = await pool.query(query, queryParams);
    const countResult = await pool.query(countQuery, countParams);

    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    res.json({
      items: itemsResult.rows,
      page,
      totalPages,
      total,
      searchTerm,
    });
  } catch (err) {
    console.error("Error fetching paginated content:", err);
    res.status(500).json({ error: "Failed to load content" });
  }
});

// GET /api/content/5 - one title by its id (used by the watch page, e.g. after a refresh)
router.get("/:id", async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid content id" });
  }

  try {
    const result = await pool.query("SELECT * FROM content WHERE id = $1", [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Content not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching content item:", err);
    res.status(500).json({ error: "Failed to load content" });
  }
});

module.exports = router;
