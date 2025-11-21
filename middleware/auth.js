// server/middleware/auth.js
// Loads the jsonwebtoken library so we can verify JWT tokens.
const jwt = require("jsonwebtoken");

// recieving req and res but calling the next() if everything is okay
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Expect: Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Authorization header missing or invalid" });
  }

  // Extracting token spring, splitting the text and taking index 1 since it is the actual token
  const token = authHeader.split(" ")[1];

  try {
    // verifying the token. Checking it hasnt expired either
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach userId to request so routes can use it. Saves the userId from the token onto the req object.
    req.userId = decoded.userId;

    next(); // continue to the route handler if everything passed if not, run the catch error.
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = requireAuth;
