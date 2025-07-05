const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    liked: {
        type: Boolean,
        default: false,
    },
    comments: [commentSchema],
});

module.exports = mongoose.model("Note", noteSchema);