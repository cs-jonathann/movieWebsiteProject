const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET /api/content?page=1&limit=24&search=batman
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 24;
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
      // No search term, return all content
      query = `
        SELECT *
        FROM content
        ORDER BY id
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

module.exports = router;
