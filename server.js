
const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Create the database directory if it doesn't exist
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

// Initialize SQLite database
const db = new Database(
  path.join(dataDir, "profiles.db")
);

// Create profiles table
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bio TEXT,
    skills TEXT,
    avatar TEXT,
    github TEXT,
    linkedin TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Get all saved profiles
app.get("/api/profiles", (req, res) => {
  try {
    const profiles = db.prepare(
      "SELECT * FROM profiles ORDER BY id DESC"
    ).all();

    res.json(profiles);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// Create and save a profile
app.post("/api/profiles", (req, res) => {
  try {
    const { name, bio, skills, avatar, github, linkedin } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        error: "Name is required"
      });
    }

    const clean = value =>
      typeof value === "string" ? value.trim() : "";

    const statement = db.prepare(`
      INSERT INTO profiles
      (name, bio, skills, avatar, github, linkedin)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = statement.run(
      name.trim(),
      clean(bio),
      clean(skills),
      clean(avatar),
      clean(github),
      clean(linkedin)
    );

    const profile = db.prepare(
      "SELECT * FROM profiles WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json(profile);
  } catch (error) {
    console.error("Error saving profile:", error);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});