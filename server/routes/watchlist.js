// server/routes/watchlist.js
const express = require("express");
const pool = require("../config/db");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// columns sent back to the frontend
const RETURN_COLUMNS = "id, user_id, content_id, watched, added_at, updated_at";

// turns an id from the URL or body into a positive whole number, or null if it isn't one
// (so "abc" gets a 400 instead of a database error)
const toId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * CREATE
 * POST /api/watchlist
 * body: { contentId }
 * 201 = added, 200 = it was already in the list
 */
router.post("/", requireAuth, async (req, res) => {
  const userId = req.userId;
  // req.body is undefined when no JSON was sent
  const contentId = toId((req.body ?? {}).contentId);

  if (!contentId) {
    return res.status(400).json({ error: "contentId is required" });
  }

  try {
    // DO NOTHING means a title that's already in the list returns no row
    const result = await pool.query(
      `INSERT INTO watchlist (user_id, content_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, content_id) DO NOTHING
       RETURNING ${RETURN_COLUMNS}`,
      [userId, contentId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ alreadyInList: true });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // 23503 = foreign key violation, the content id doesn't exist
    if (err.code === "23503") {
      return res.status(404).json({ error: "Title not found" });
    }
    console.error("Watchlist add error:", err);
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

/**
 * READ
 * GET /api/watchlist
 * returns current user's watchlist + joined content info
 */
router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId;

  try {
    const result = await pool.query(
      `SELECT w.id, w.watched, w.added_at, w.updated_at,
              c.id AS content_id, c.title, c.type, c.poster_url,
              c.release_year, c.genre, c.tmdb_id
       FROM watchlist w
       JOIN content c ON w.content_id = c.id
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Watchlist fetch error:", err);
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

/**
 * UPDATE
 * PUT /api/watchlist/:id
 * body: { watched }  (true or false)
 */
router.put("/:id", requireAuth, async (req, res) => {
  const userId = req.userId;
  const watchlistId = toId(req.params.id);
  const { watched } = req.body ?? {};

  if (!watchlistId) {
    return res.status(400).json({ error: "Invalid watchlist id" });
  }
  if (typeof watched !== "boolean") {
    return res.status(400).json({ error: "watched must be true or false" });
  }

  try {
    const result = await pool.query(
      `UPDATE watchlist
       SET watched = $1,
           updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING ${RETURN_COLUMNS}`,
      [watched, watchlistId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Watchlist item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Watchlist update error:", err);
    res.status(500).json({ error: "Failed to update watchlist item" });
  }
});

/**
 * DELETE
 * DELETE /api/watchlist/:id
 */
router.delete("/:id", requireAuth, async (req, res) => {
  const userId = req.userId;
  const watchlistId = toId(req.params.id);

  if (!watchlistId) {
    return res.status(400).json({ error: "Invalid watchlist id" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM watchlist
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [watchlistId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Watchlist item not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Watchlist delete error:", err);
    res.status(500).json({ error: "Failed to delete watchlist item" });
  }
});

module.exports = router;
