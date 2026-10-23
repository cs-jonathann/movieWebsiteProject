// Vercel entry point: Vercel runs every file in /api as a serverless function.
// This one just hands every request to our Express app.
module.exports = require("../server");
