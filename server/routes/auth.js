// server/routes/auth.js
const express = require("express"); // need this to create a router
const bcrypt = require("bcrypt"); // library for hashing passwords.
const jwt = require("jsonwebtoken"); // used to create JWT tokens when a user register / logs in
const pool = require("../config/db"); // your PostgreSQL connection pool from config/db.js. This is how we talk to the users table.

const router = express.Router(); // define routes in this file and then plug them into server.js

// -------------------------
// POST /api/auth/register
// -------------------------
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body; // pulls username, email, and password out of the JSON body.

  if (!username || !email || !password) {
    // checking if anything is missing, if so send a error.
    return res
      .status(400)
      .json({ error: "username, email, and password are required" });
  }

  try {
    // 1) Check if user already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
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
// This route logs a user in using their email + password.
// It checks the email, compares the password with the hashed one in the DB,
// and if correct, returns a JWT token + user info (similar to register).
router.post("/login", async (req, res) => {
  const { email, password } = req.body; // what the frontend sent in the JSON body

  // basic validation: both fields are required
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    // 1) Look up user by email
    const result = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    // if result.rows is empty, no user exists with that email
    if (result.rows.length === 0) {
      // we use a generic message so we don't leak which part is wrong
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0]; // row that contains user info + hashed password

    // 2) Compare plain text password with the hashed password from the DB
    const passwordMatch = await bcrypt.compare(
      password, // plain text password from the login form
      user.password_hash // hashed password stored in the database
    );

    // if passwords don't match, send 401 with same generic message
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
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
