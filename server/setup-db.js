require("dotenv").config();
const fs = require("fs");
const pool = require("./config/db");

async function setupDatabase() {
  try {
    const schema = fs.readFileSync("./database/schema.sql", "utf8");
    await pool.query(schema);
    console.log("✅ Database schema created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating schema:", err);
    process.exit(1);
  }
}

setupDatabase();
