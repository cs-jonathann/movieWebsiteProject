// loads environment variables from .env
require("dotenv").config();

// imports Express
const express = require("express");

// imports CORS middleware
const cors = require("cors");

// PostgreSQL pool
const pool = require("./config/db");

// routes
const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const watchlistRoutes = require("./routes/watchlist");

// Creates an express application
const app = express();

// using PORT from .env or default to 5100
const PORT = process.env.PORT || 5100;

// CORS setup:
// In production we'll set CLIENT_ORIGIN in Railway so only our frontend can talk to this backend.
// In development we default to Vite's URL.
// allow both local dev and vercel
const allowedOrigin = [
  "http://localhost:5173",
  "https://movie-website-project-3xn3y729j-notjonathans-projects.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigin,
  })
); // enables cors for frontend requests

app.use(express.json()); // parses incoming JSON requests

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Test route for pool (handy both locally and on Railway)
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error("Database test failed:", err); // log full error in terminal

    // In production you might want to hide details; but for now this helps debugging
    res.status(500).json({
      error: "Database connection failed",
      message: err.message,
      code: err.code,
    });
  }
});

// this is what makes /api/auth/register and /api/auth/login exist
app.use("/api/auth", authRoutes);

// content routes
app.use("/api/content", contentRoutes);

// watchlist routes
app.use("/api/watchlist", watchlistRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("DB name from env:", process.env.DB_NAME); // confirming .env is working
});
