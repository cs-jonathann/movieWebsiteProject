// server/routes/auth.js
const express = require("express"); // need this to create a router
const bcrypt = require("bcrypt"); // library for hashing passwords.
const jwt = require("jsonwebtoken"); // used to create JWT tokens when a user register / logs in
const rateLimit = require("express-rate-limit"); // limits how many login attempts one IP can make
const pool = require("../config/db"); // your PostgreSQL connection pool from config/db.js. This is how we talk to the users table.

const router = express.Router(); // define routes in this file and then plug them into server.js

// same response for "no such user" and "wrong password" so we don't leak which part is wrong
const INVALID_LOGIN = { error: "Invalid email/username or password" };

// a real bcrypt hash of a random string. when no user is found we still compare against it,
// so a login for an unknown username takes as long as one for a real username
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

// turns a request field into a trimmed string ("" if it's missing or not a string)
const cleanField = (value) => (typeof value === "string" ? value.trim() : "");

// 10 failed attempts per IP every 15 minutes. successful logins don't count
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

// -------------------------
// POST /api/auth/register
// -------------------------
router.post("/register", async (req, res) => {
  // pulls username, email, and password out of the JSON body.
  // trimmed so a stray space from phone autocomplete doesn't end up in the saved name
  const username = cleanField(req.body.username);
  const email = cleanField(req.body.email);
  const { password } = req.body;

  if (!username || !email || !password) {
    // checking if anything is missing, if so send a error.
    return res
      .status(400)
      .json({ error: "username, email, and password are required" });
  }

  // login decides "email or username?" by looking for an @, so emails need one and usernames can't have one
  if (username.includes("@")) {
    return res.status(400).json({ error: "Username can't contain @" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ error: "Please enter a valid email" });
  }

  try {
    // 1) Check if user already exists (ignoring upper/lower case, since login ignores it too)
    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)",
      [email, username]
    );

    if (existing.rows.length > 0) {
      // if we find a row, that means this email or username is already taken
      return res
        .status(409)
        .json({ error: "User with that email or username already exists" });
    }

    // 2) Hash password
    // 10 is the "salt rounds" value – how expensive the hashing is
    const passwordHash = await bcrypt.hash(password, 10);

    // 3) Insert user
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, passwordHash]
    );

    const user = result.rows[0]; // the new user's public info (no password here)

    // 4) Create JWT
    // store only the user id in the token payload
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // token valid for 1 hour
    });

    // send back the user + token so the frontend can store them
    res.status(201).json({ user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------
// POST /api/auth/login
// -------------------------
// This route logs a user in using their email OR username + password.
// It finds the account, compares the password with the hashed one in the DB,
// and if correct, returns a JWT token + user info (similar to register).
router.post("/login", loginLimiter, async (req, res) => {
  // "identifier" is whatever they typed in the "Email or username" box.
  // still accept "email" so older versions of the frontend keep working
  const identifier = cleanField(req.body.identifier ?? req.body.email);
  const { password } = req.body;

  // basic validation: both fields are required
  if (!identifier || typeof password !== "string" || !password) {
    return res
      .status(400)
      .json({ error: "email or username, and password are required" });
  }

  try {
    // 1) Look up the user. usernames can't contain @, so an @ means it's an email.
    // upper/lower case doesn't matter, so "Bob" and "bob" are the same account
    const column = identifier.includes("@") ? "email" : "username";
    const result = await pool.query(
      `SELECT id, username, email, password_hash FROM users WHERE LOWER(${column}) = LOWER($1)`,
      [identifier]
    );

    // 2) Compare plain text password with the hashed password from the DB.
    // older accounts could differ only by case, so check each match until one fits.
    // if nobody matched, compare against DUMMY_HASH so the response takes the same time
    let user = null;
    for (const row of result.rows) {
      if (await bcrypt.compare(password, row.password_hash)) {
        user = row;
        break;
      }
    }
    if (result.rows.length === 0) {
      await bcrypt.compare(password, DUMMY_HASH);
    }

    // no matching user, or wrong password: same generic message either way
    if (!user) {
      return res.status(401).json(INVALID_LOGIN);
    }

    // 3) Create a JWT token for this logged-in user
    const token = jwt.sign(
      { userId: user.id }, // payload: we store the user's id
      process.env.JWT_SECRET, // secret key from .env
      { expiresIn: "1h" } // token valid for 1 hour
    );

    // 4) Send back user info (without password_hash) and token
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    // this will run if something unexpected happens (DB down, typo, etc.)
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
