// server/services/demoAccount.js
// The shared demo account that recruiters / reviewers can log into (listed in the README).
// Everyone uses the same account, so it gets put back to a clean starting state on every
// demo login. That way one visitor's changes (or notes) never show up for the next one.
const pool = require("../config/db");

const DEMO_USERNAME = "demo";
const DEMO_EMAIL = "demo@example.com";

// true if this user row is the shared demo account
const isDemoUser = (user) => user.username.toLowerCase() === DEMO_USERNAME;

// clears the demo's My List + Continue Watching, then adds the 3 most popular movies
// and 2 most popular shows. runs in a transaction so it's never left half-reset
async function resetDemoAccount(userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM watchlist WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM watch_progress WHERE user_id = $1", [
      userId,
    ]);
    await client.query(
      `INSERT INTO watchlist (user_id, content_id)
       SELECT $1, id FROM (
         (SELECT id FROM content WHERE type = 'movie' ORDER BY popularity DESC NULLS LAST LIMIT 3)
         UNION ALL
         (SELECT id FROM content WHERE type = 'tv_show' ORDER BY popularity DESC NULLS LAST LIMIT 2)
       ) picks`,
      [userId]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { DEMO_USERNAME, DEMO_EMAIL, isDemoUser, resetDemoAccount };
