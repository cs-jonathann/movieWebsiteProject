// loads environment variables from .env
require("dotenv").config();

// imports Express
const express = require("express");

//imports CORS middleware
const cors = require("cors");

const authRoutes = require("./routes/auth");

// Creates an express application
const app = express();

// using PORT from .env or default to 5000
const PORT = process.env.PORT || 5100;

// Test route for pool, go down in file to find test
const pool = require("./config/db");

// Middleware
app.use(cors()); // enables cors for frontend requests
app.use(express.json()); // parses incoming JSON requests

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Test route for pool
// app.get("/api/db-test", async (req, res) => {
//   try {
//     const result = await pool.query("SELECT NOW()");
//     res.json({ dbTime: result.rows[0].now });
//   } catch (err) {
//     console.error("Database test failed", err);
//     res.status(500).json({ error: "Database connection failed" });
//   }
// });

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error("Database test failed:", err); // log full error in terminal

    // ⚠️ DEV-ONLY: send details to browser so we can debug
    res.status(500).json({
      error: "Database connection failed",
      message: err.message,
      code: err.code,
    });
  }
});

// this is what makes /api/auth/register exist
app.use("/api/auth", authRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// confirming .env is working
console.log("DB name from env:", process.env.DB_NAME);
