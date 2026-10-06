
const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new Database(
  path.join(__dirname, "data", "profiles.db")
);

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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Display all saved profiles
app.get("/api/profiles", (req, res) => {
  const profiles = db.prepare(
    "SELECT * FROM profiles ORDER BY id DESC"
  ).all();

  res.json(profiles);
});

// Process form and save profile
app.post("/api/profiles", (req, res) => {
  const { name, bio, skills, avatar, github, linkedin } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: "Name is required"
    });
  }

  const statement = db.prepare(`
    INSERT INTO profiles
    (name, bio, skills, avatar, github, linkedin)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    name.trim(),
    (bio || "").trim(),
    (skills || "").trim(),
    (avatar || "").trim(),
    (github || "").trim(),
    (linkedin || "").trim()
  );

  const profile = db.prepare(
    "SELECT * FROM profiles WHERE id = ?"
  ).get(result.lastInsertRowid);

  res.status(201).json(profile);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});