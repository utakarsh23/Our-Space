const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const checkKey = require("./middleware/checkKey");
const Note = require("./model/Note");
const app = express();

// ✅ Enable CORS without app.options
app.use(cors({
    origin: ["http://localhost:5174","https://our-space-vi1q.vercel.app"], // or "*" if you don't care
    credentials: true,
}));

app.use(express.json());

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("🌸 Connected to MongoDB"))
    .catch((err) => console.error("MongoDB error:", err));

// Routes
app.get("/notes", checkKey, async (req, res) => {
    console.log("yayyyy1")
    const notes = await Note.find().sort({ timestamp: -1 });
    res.json(notes);
});

app.post("/notes", checkKey, async (req, res) => {
    console.log("yayyy2")
    const { title, message } = req.body;
    const note = new Note({ title, message });
    await note.save();
    res.status(201).json(note);
});

app.put("/notes/:id", checkKey, async (req, res) => {
    const { id } = req.params;
    const { title, message } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(id, { title, message }, { new: true });
    res.json(updatedNote);
});

app.delete("/notes/:id", checkKey, async (req, res) => {
    const { id } = req.params;
    await Note.findByIdAndDelete(id);
    res.sendStatus(204);
});

// Assuming you're using Mongoose
app.post("/notes/:id/like", checkKey, async (req, res) => {
    const { id } = req.params;
    const { liked } = req.body;

    console.log("like")
    try {
        const note = await Note.findById(id);
        if (!note) return res.status(404).send("Note not found");

        note.liked = liked; // or increment a 'likes' counter if you prefer
        await note.save();

        res.sendStatus(200);
    } catch (err) {
        console.error("Like update failed:", err);
        res.status(500).send("Server error");
    }
});

app.post("/notes/:id/comments", checkKey, async (req, res) => {
    const { text } = req.body;

    console.log("comment")
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ error: "Note not found" });

        note.comments.push({ text });
        await note.save();

        res.status(201).json(note.comments[note.comments.length - 1]); // send back the new comment
    } catch (err) {
        res.status(500).json({ error: "Failed to add comment" });
    }
});

app.get("/notes/:id/comments", checkKey, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ error: "Note not found" });

        res.json(note.comments);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`💖 Server running on http://localhost:${PORT}`);
});