// server/routes/auth.js
const express = require("express"); // need this to create a router
const bcrypt = require("bcrypt"); // library for hashing passwords.
const jwt = require("jsonwebtoken"); // used to create JWT tokens when a user register
const pool = require("../config/db"); // your PostgreSQL connection pool from config/db.js. This is how we talk to the users table.

const router = express.Router(); // define routes in this file and then plug them into server.js

// POST /api/auth/register
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
    // checking if a user with this email/username already exists.
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    // existing.rows is an array of rows returned from the query.
    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "User with that email or username already exists" });
    }

    // 2) Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    // 10 is the salt rounds – basically how strong/slow the hashing is (10 is a normal default).
    // passwordHash will be a long string like $2b$10$something... that looks nothing like the original password. You never store password directly in the DB. Only the hash.

    // 3) Insert user
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, passwordHash]
    );

    const user = result.rows[0];

    // 4) Create JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      // process.env.JWT_SECRET: The secret key from your .env (the long random string). Used to sign the token so nobody can fake it.

      expiresIn: "1h", // Token is valid for 1 hour.

      // The frontend will store this and send it in the Authorization header for protected routes.
    });

    res.status(201).json({ user, token }); //correct status code when you create a new resource.
    // The client gets both: user – the safe user info (no password). token – JWT they’ll use to authenticate future requests.
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login. This route is for when a user logs in, and if the email & password are real then we can give back the user info + a JWT so that the user can stay logged in
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Basic validation, If either email or pw is missing/empty, send back a 400 bad request error. Return stops the function so nothing else returns
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    // trying db queries and pw checks, if not, catch(err) if anything goes wrong
    // 1) Find user by email
    const result = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    // results.rows is an array of matching users, if no user is found then you send a 401 unauthorized.
    if (result.rows.length === 0) {
      // don't reveal if it's email or password that's wrong
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Get the first (and only) matching user now
    const user = result.rows[0];

    // 2) Compare password with stored hash
    // bycrypt.compare takes password = the text password the user just typed
    // user.password_hash = the hashed password from your database.
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3) Create JWT
    // Embedding the users ID inside the token
    // process.env.JWT_SECRET is the secret string from .env, the token is set to expire in 1 hour. This token is what you’ll send with future requests to prove who you are.
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // 4) Return user (without password_hash) and token. Frontend will save the token
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// lets server use the router
module.exports = router;
