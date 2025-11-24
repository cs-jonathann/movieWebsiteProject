// server/routes/watchlist.js
const express = require("express");
const pool = require("../config/db");
const requireAuth = require("../middleware/auth");

const router = express.Router();

/**
 * CREATE
 * POST /api/watchlist
 * body: { contentId, notes? }
 */
router.post("/", requireAuth, async (req, res) => {
  const userId = req.userId;
  const { contentId, notes } = req.body;

  if (!contentId) {
    return res.status(400).json({ error: "contentId is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO watchlist (user_id, content_id, notes)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, content_id)
       DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING *`,
      [userId, contentId, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
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
      `SELECT w.id, w.watched, w.notes, w.added_at, w.updated_at,
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
 * body: { watched?, notes? }
 */
router.put("/:id", requireAuth, async (req, res) => {
  const userId = req.userId;
  const watchlistId = req.params.id;
  const { watched, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE watchlist
       SET watched = COALESCE($1, watched),
           notes   = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [watched, notes, watchlistId, userId]
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
  const watchlistId = req.params.id;

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
