// loads environment variables from .env
require("dotenv").config();

// imports Express
const express = require("express");

//imports CORS middleware
const cors = require("cors");

// Creates an express application
const app = express();

// using PORT from .env or default to 5000
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // enables cors for frontend requests
app.use(express.json()); // parses incoming JSON requests

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// confirming .env is working
console.log("DB name from env:", process.env.DB_NAME);
