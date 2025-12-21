const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const requireAuth = require("../middleware/auth"); // Changed from authenticateToken

// GET /api/progress - Get user's continue watching list
router.get("/", requireAuth, async (req, res) => {
  // Changed from authenticateToken
  try {
    const userId = req.userId; // Changed from req.user.id

    // Get recent watch progress with content details
    const result = await pool.query(
      `SELECT 
        wp.id,
        wp.content_id,
        wp.progress_seconds,
        wp.duration_seconds,
        wp.last_watched,
        c.title,
        c.type,
        c.poster_url,
        c.release_year,
        c.genre,
        c.tmdb_id,
        c.imdb_id
       FROM watch_progress wp
       JOIN content c ON wp.content_id = c.id
       WHERE wp.user_id = $1
         AND wp.progress_seconds > 0
         AND wp.progress_seconds < wp.duration_seconds * 0.95
       ORDER BY wp.last_watched DESC
       LIMIT 10`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching watch progress:", err);
    res.status(500).json({ error: "Failed to fetch watch progress" });
  }
});

// POST /api/progress - Save or update watch progress
router.post("/", requireAuth, async (req, res) => {
  // Changed from authenticateToken
  try {
    const userId = req.userId; // Changed from req.user.id
    const { contentId, progressSeconds, durationSeconds } = req.body;

    if (!contentId || progressSeconds === undefined || !durationSeconds) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Upsert watch progress
    const result = await pool.query(
      `INSERT INTO watch_progress (user_id, content_id, progress_seconds, duration_seconds, last_watched)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, content_id)
       DO UPDATE SET
         progress_seconds = EXCLUDED.progress_seconds,
         duration_seconds = EXCLUDED.duration_seconds,
         last_watched = NOW()
       RETURNING *`,
      [userId, contentId, progressSeconds, durationSeconds]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error saving watch progress:", err);
    res.status(500).json({ error: "Failed to save watch progress" });
  }
});

// GET /api/progress/:contentId - Get progress for specific content
router.get("/:contentId", requireAuth, async (req, res) => {
  // Changed from authenticateToken
  try {
    const userId = req.userId; // Changed from req.user.id
    const contentId = parseInt(req.params.contentId, 10);

    const result = await pool.query(
      `SELECT * FROM watch_progress
       WHERE user_id = $1 AND content_id = $2`,
      [userId, contentId]
    );

    if (result.rows.length === 0) {
      return res.json({ progress_seconds: 0, duration_seconds: 0 });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching progress:", err);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

// DELETE /api/progress/:contentId - Remove progress (when finished)
router.delete("/:contentId", requireAuth, async (req, res) => {
  // Changed from authenticateToken
  try {
    const userId = req.userId; // Changed from req.user.id
    const contentId = parseInt(req.params.contentId, 10);

    await pool.query(
      `DELETE FROM watch_progress
       WHERE user_id = $1 AND content_id = $2`,
      [userId, contentId]
    );

    res.json({ message: "Progress removed" });
  } catch (err) {
    console.error("Error deleting progress:", err);
    res.status(500).json({ error: "Failed to delete progress" });
  }
});

module.exports = router;
