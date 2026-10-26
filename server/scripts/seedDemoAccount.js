// server/scripts/seedDemoAccount.js
// Creates the shared demo account if it doesn't exist yet, then resets its list.
// Run from server/ after setup-db.js and the TMDB import:  node scripts/seedDemoAccount.js
// The password can be changed with DEMO_PASSWORD (remember to update the README too).
require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const {
  DEMO_USERNAME,
  DEMO_EMAIL,
  resetDemoAccount,
} = require("../services/demoAccount");

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "WatchDemo2026";

async function main() {
  const existing = await pool.query(
    "SELECT id FROM users WHERE LOWER(username) = $1",
    [DEMO_USERNAME]
  );

  let userId;
  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;
    console.log(`Demo account already exists (id ${userId}).`);
  } else {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [DEMO_USERNAME, DEMO_EMAIL, passwordHash]
    );
    userId = result.rows[0].id;
    console.log(`Created demo account (id ${userId}).`);
  }

  await resetDemoAccount(userId);
  console.log("Demo list reset to the starting titles.");
}

main()
  .catch((err) => {
    console.error("Demo seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
