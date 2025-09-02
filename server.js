const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // serves your home page files

const NOTES_FILE = path.join(__dirname, "notes.json");

// --- Simple password for leaders ---
const ADMIN_PASSWORD = "GOD"; // change this to your secret password

// ===== Serve Home Page =====
// Assumes you have index.html inside public folder
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "welcome.html"));
});

// ===== Bible Notes API =====

// Get all notes
app.get("/api/notes", (req, res) => {
  fs.readFile(NOTES_FILE, "utf8", (err, data) => {
    if (err) return res.json([]);
    try {
      const notes = JSON.parse(data || "[]");
      res.json(notes);
    } catch (e) {
      res.json([]);
    }
  });
});

// Leader login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: "Wrong password" });
});

// Add a new note
app.post("/api/notes", (req, res) => {
  const { title, body, tags, author, date } = req.body;
  if (!author) return res.status(403).json({ error: "Unauthorized" });
  if (!title || !body) return res.status(400).json({ error: "Missing fields" });

  fs.readFile(NOTES_FILE, "utf8", (err, data) => {
    let notes = [];
    if (!err && data) notes = JSON.parse(data);

    const newNote = {
      id: uuidv4(),
      title,
      body,
      tags: tags || [],
      author,
      date: date || new Date().toISOString()
    };
    notes.push(newNote);

    fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Failed to save note" });
      res.json(newNote);
    });
  });
});

// Edit note
app.put("/api/notes/:id", (req, res) => {
  const { id } = req.params;
  const { title, body, tags, author, date } = req.body;
  if (!author) return res.status(403).json({ error: "Unauthorized" });

  fs.readFile(NOTES_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Read error" });
    let notes = JSON.parse(data || "[]");
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return res.status(404).json({ error: "Note not found" });

    notes[idx] = { ...notes[idx], title, body, tags, author, date };
    fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Write error" });
      res.json(notes[idx]);
    });
  });
});

// Delete note
app.delete("/api/notes/:id", (req, res) => {
  const { id } = req.params;
  fs.readFile(NOTES_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Read error" });
    let notes = JSON.parse(data || "[]");
    const newNotes = notes.filter(n => n.id !== id);
    fs.writeFile(NOTES_FILE, JSON.stringify(newNotes, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Write error" });
      res.json({ success: true });
    });
  });
});

// ===== Start server =====
app.listen(3000, () => console.log('Server running on http://localhost:3000'));

