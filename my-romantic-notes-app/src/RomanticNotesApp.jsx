// unchanged imports
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Heart, Pencil, Trash2, X, MessageCircle } from "lucide-react";
import { HeartIcon } from "@heroicons/react/24/solid";
import "@fontsource/dancing-script";
import "@fontsource/pacifico";

const API_URL = "https://our-space-lhto.onrender.com/notes";

export default function RomanticNotesApp() {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [previewNote, setPreviewNote] = useState(null);
    const [likes, setLikes] = useState({});
    const [showComments, setShowComments] = useState({});
    const [showCommentBox, setShowCommentBox] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentsData, setCommentsData] = useState([]);
    const [trail, setTrail] = useState([]);
    const [secretKey, setSecretKey] = useState("");
    const [showKeyPrompt, setShowKeyPrompt] = useState(true);
    const [inputKey, setInputKey] = useState("");

    const fetchNotes = async () => {
        const key = localStorage.getItem("secretKey");
        const res = await axios.get(API_URL, {
            headers: { "x-api-key": key }
        });
        setNotes(res.data);
        const initialLikes = {};
        res.data.forEach((note) => {
            initialLikes[note._id] = note.liked;
        });
        setLikes(initialLikes);
    };

    useEffect(() => {
        const storedKey = localStorage.getItem("secretKey");
        const expiry = localStorage.getItem("keyExpiry");

        if (storedKey && expiry && Date.now() < Number(expiry)) {
            setSecretKey(storedKey);
            setShowKeyPrompt(false);
        }
    }, []);

    useEffect(() => {
        let clearTimeoutId;

        const handleMove = (e) => {
            const x = e.clientX || (e.touches && e.touches[0].clientX);
            const y = e.clientY || (e.touches && e.touches[0].clientY);
            if (x && y) {
                setTrail((prev) => {
                    const now = Date.now();
                    if (prev.length > 0 && now - prev[prev.length - 1].id < 200) return prev;
                    return [...prev.slice(-4), { x, y, id: now }];
                });
            }

            // Clear all hearts shortly after stopping
            clearTimeout(clearTimeoutId);
            clearTimeoutId = setTimeout(() => {
                setTrail([]);
            }, 100); // 100ms after no movement
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("touchmove", handleMove, { passive: true });

        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("touchmove", handleMove);
            clearTimeout(clearTimeoutId);
        };
    }, []);
    useEffect(() => {
        fetchNotes();
    }, []);

    useEffect(() => {
        const fetchComments = async () => {
            if (previewNote?._id) {
                try {
                    const key = localStorage.getItem("secretKey");
                    const res = await axios.get(`${API_URL}/${previewNote._id}/comments`, {
                        headers: { "x-api-key": key }
                    });
                    setCommentsData(res.data);
                } catch (err) {
                    console.error("Failed to fetch comments:", err);
                }
            }
        };
        fetchComments();
    }, [previewNote, showCommentBox]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const key = localStorage.getItem("secretKey");

        if (editingId) {
            await axios.put(
                `${API_URL}/${editingId}`,
                { title, message },
                { headers: { "x-api-key": key } }
            );
        } else {
            await axios.post(
                API_URL,
                { title, message },
                { headers: { "x-api-key": key } }
            );
        }
        setTitle("");
        setMessage("");
        setEditingId(null);
        setShowForm(false);
        fetchNotes();
    };

    const handleDelete = async (id) => {
        const key = localStorage.getItem("secretKey");

        await axios.delete(`${API_URL}/${id}`, {
            headers: { "x-api-key": key }
        });
        fetchNotes();
        setPreviewNote(null);
        setShowCommentBox(false);
    };

    const handleEdit = (note) => {
        setTitle(note.title);
        setMessage(note.message);
        setEditingId(note._id);
        setShowForm(true);
        setPreviewNote(null);
        setShowCommentBox(false);
    };

    const toggleComments = (id) => {
        setShowComments((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const toggleLike = async (id) => {
        const newLiked = !likes[id];
        setLikes((prev) => ({
            ...prev,
            [id]: newLiked,
        }));
        try {
            const key = localStorage.getItem("secretKey");

            await axios.post(`${API_URL}/${id}/like`,
                { liked: newLiked },
                { headers: { "x-api-key": key } }
            );
        } catch (error) {
            console.error("Failed to update like:", error);
        }
    };

    const handleSubmitKey = () => {
        if (inputKey.trim()) {
            localStorage.setItem("secretKey", inputKey.trim());
            localStorage.setItem("keyExpiry", Date.now() + 24 * 60 * 60 * 1000);
            setSecretKey(inputKey.trim());
            setShowKeyPrompt(false);
        }
    };

    const handlePostComment = async () => {
        if (!commentText.trim() || !previewNote?._id) return;
        setCommentLoading(true);
        try {
            const key = localStorage.getItem("secretKey");

            await axios.post(
                `${API_URL}/${previewNote._id}/comments`,
                { text: commentText.trim() },
                { headers: { "x-api-key": key } }
            );
            setCommentText("");
            setShowCommentBox(false);
            const res = await axios.get(`${API_URL}/${previewNote._id}/comments`, {
                headers: { "x-api-key": key }
            });
            setCommentsData(res.data);
        } catch (err) {
            console.error("Failed to post comment:", err);
        } finally {
            setCommentLoading(false);
        }
    };

    return (
        <div className={`relative z-0 min-h-screen p-6 font-['Dancing Script'] transition-colors duration-500 ${
            darkMode
                ? "bg-gradient-to-b from-[#0d1b2a] via-[#1b263b] to-[#1e2e42] text-white"
                : "bg-gradient-to-br from-blue-100 via-indigo-100 to-pink-100 text-gray-800"
        }`}>
            <h1 className="text-4xl sm:text-5xl text-center font-['Pacifico'] mb-6 text-pink-600">
                These are the words I never stop writing for you 💌
            </h1>

            <div className="text-center mb-6">
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`px-4 py-2 rounded-full transition-all text-white ${darkMode ? "bg-pink-700 hover:bg-pink-600" : "bg-indigo-400 hover:bg-indigo-500"}`}
                >
                    {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </button>
            </div>

            {/* Romantic Letter Preview */}
            <AnimatePresence>
                {previewNote && (
                    <motion.div
                        key="preview-backdrop"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.25}}
                        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40"
                    >
                        <motion.div
                            key="preview-card"
                            initial={{opacity: 0, y: 60, scale: 0.9}}
                            animate={{opacity: 1, y: 0, scale: 1}}
                            exit={{opacity: 0, y: 30, scale: 0.95}}
                            transition={{
                                type: "spring",
                                damping: 18,
                                stiffness: 200,
                            }}
                            className={`relative w-[90%] max-w-3xl p-8 rounded-3xl shadow-xl overflow-hidden ${
                                darkMode ? "bg-gray-800 text-white" : "bg-pink-50 text-gray-700"
                            }`}
                        >
                            <X
                                onClick={() => {
                                    setPreviewNote(null);
                                    setShowCommentBox(false);
                                }}
                                className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-pink-400"
                            />
                            <div className="absolute top-4 left-4 flex gap-2">
                                <Pencil
                                    onClick={() => handleEdit(previewNote)}
                                    className="w-5 h-5 cursor-pointer text-yellow-400 hover:text-yellow-500"
                                />
                                <Trash2
                                    onClick={() => handleDelete(previewNote._id)}
                                    className="w-5 h-5 cursor-pointer text-red-400 hover:text-red-500"
                                />
                                <MessageCircle
                                    onClick={() => setShowCommentBox((prev) => !prev)}
                                    className="w-5 h-5 cursor-pointer text-blue-400 hover:text-blue-500"
                                />
                            </div>
                            <Heart
                                onClick={() => toggleLike(previewNote._id)}
                                className={`w-8 h-8 mx-auto mb-4 cursor-pointer ${
                                    likes[previewNote._id] ? "text-pink-500 fill-pink-500" : "text-pink-300"
                                }`}
                            />
                            <h2 className="text-3xl text-center font-['Pacifico'] text-red-500 mb-4">{previewNote.title}</h2>
                            <div className="max-h-[50vh] overflow-y-auto px-4 pb-2">
                                <p className="whitespace-pre-wrap text-center text-lg leading-relaxed">{previewNote.message}</p>
                            </div>
                            <div className="mt-4 text-sm text-center italic text-gray-400">
                                {new Date(previewNote.timestamp).toLocaleString()}
                            </div>

                            {/* Comment Modal */}
                            <AnimatePresence>
                                {showCommentBox && (
                                    <motion.div
                                        initial={{opacity: 0, y: 30}}
                                        animate={{opacity: 1, y: 0}}
                                        exit={{opacity: 0, y: 30}}
                                        className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md rounded-xl p-4 shadow-lg flex items-center gap-3 ${
                                            darkMode
                                                ? "bg-gray-700 text-white"
                                                : "bg-white text-gray-800 border border-pink-200"
                                        }`}
                                    >
                                        <input
                                            className="flex-1 bg-transparent outline-none placeholder-pink-400"
                                            placeholder="Whisper a sweet comment..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handlePostComment();
                                            }}
                                        />
                                        <Heart
                                            onClick={handlePostComment}
                                            className={`w-5 h-5 cursor-pointer ${
                                                darkMode ? "text-pink-400" : "text-pink-600"
                                            } ${commentLoading ? "animate-ping" : ""}`}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Side comment stack */}
                            <AnimatePresence>
                                {showCommentBox && commentsData.length > 0 && (
                                    <motion.div
                                        initial={{opacity: 0, y: 20}}
                                        animate={{opacity: 1, y: 0}}
                                        exit={{opacity: 0, y: 20}}
                                        drag
                                        dragConstraints={false}
                                        dragElastic={0.2}
                                        className="fixed top-32 left-16 z-[60] w-72 max-h-[75vh] overflow-y-auto bg-white text-pink-700 rounded-2xl shadow-2xl border border-pink-300 p-4 cursor-move"
                                    >
                                        <h3 className="text-lg mb-3 font-semibold text-pink-600">
                                            💬 Sweet Comments
                                        </h3>
                                        <div className="space-y-3">
                                            {commentsData.map((c, i) => (
                                                <div key={i} className="bg-pink-100 px-3 py-2 rounded-xl shadow-sm">
                                                    {c.text}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...notes, {isAdd: true}].map((note, i) => {
                    if (note.isAdd) {
                        return (
                            <div
                                key="add-tile"
                                className="aspect-square flex flex-col justify-center items-center border-2 border-dashed border-pink-400 bg-white/80 hover:bg-pink-50 rounded-xl cursor-pointer"
                                onClick={() => {
                                    setTitle("");
                                    setMessage("");
                                    setEditingId(null);
                                    setShowForm(true);
                                }}
                            >
                                <Plus className="w-8 h-8 mb-2 text-pink-400"/>
                                <p className="text-pink-500 font-semibold">Add Note</p>
                            </div>
                        );
                    }

                    const colors = ["bg-red-100", "bg-yellow-100", "bg-green-100", "bg-pink-100", "bg-indigo-100"];
                    const textColors = ["text-red-700", "text-yellow-700", "text-green-700", "text-pink-700", "text-indigo-700"];
                    const bg = colors[i % colors.length];
                    const text = textColors[i % textColors.length];

                    return (
                        <motion.div
                            key={note._id}
                            layout
                            onClick={() => setPreviewNote(note)}
                            className={`relative aspect-square p-4 rounded-xl shadow-md cursor-pointer flex flex-col justify-between ${bg} ${text}`}
                        >
                            {likes[note._id] && (
                                <HeartIcon
                                    className="absolute -top-4 -right-4 w-16 h-16 text-red-500 rotate-[35deg] drop-shadow-lg"/>
                            )}
                            <div>
                                <h2 className="text-lg font-bold text-red-600 mb-1 line-clamp-2">{note.title}</h2>
                                <p className="text-sm line-clamp-4 whitespace-pre-wrap">{note.message}</p>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-xs">
                                <div className="flex items-center gap-1">
                                    <Heart className="w-4 h-4 text-pink-500"/>
                                </div>
                                <MessageCircle
                                    className="w-4 h-4 text-blue-400 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleComments(note._id);
                                    }}
                                />
                            </div>
                            {showComments[note._id] && (
                                <div className="mt-2 text-xs italic text-gray-500">
                                    Comment section coming soon 💬
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* 💌 Add Note Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black/30"
                    >
                        <motion.div
                            className={`relative w-[96%] max-w-5xl min-h-[75vh] px-12 py-10 rounded-[2rem] border-[1px] shadow-[0_0_60px_rgba(255,192,203,0.5)] ${
                                darkMode ? "bg-gray-800/50 text-white" : "bg-pink-50/60 text-gray-800"
                            } backdrop-blur-2xl border-pink-200`}
                        >
                            {/* Close Button */}
                            <X
                                onClick={() => setShowForm(false)}
                                className="absolute top-5 right-5 w-6 h-6 cursor-pointer text-pink-400 hover:text-pink-500"
                            />

                            {/* Romantic Stickers */}
                            <div className="absolute top-2 left-4 text-2xl">💌</div>
                            <div className="absolute bottom-3 left-6 text-2xl">🌹</div>
                            <div className="absolute bottom-2 right-4 text-2xl">💘</div>

                            {/* Petal Animation */}
                            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                                {[...Array(7)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{y: -40, opacity: 0}}
                                        animate={{y: "130%", opacity: [0, 0.6, 0]}}
                                        transition={{
                                            duration: 12 + Math.random() * 8,
                                            delay: i * 0.6,
                                            repeat: Infinity,
                                        }}
                                        className="absolute text-pink-300 text-lg"
                                        style={{
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 20}%`,
                                        }}
                                    >
                                        ❣️
                                    </motion.div>
                                ))}
                            </div>

                            {/* Header */}
                            <h2 className="text-4xl font-['Pacifico'] text-center text-pink-600 mb-8 z-10 relative">
                                {editingId ? "Edit Your Letter 💌" : "Write Something Sweet 💖"}
                            </h2>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="flex flex-col gap-6 z-10 relative">
                                <input
                                    type="text"
                                    placeholder="Title of your love letter..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="w-full p-4 text-2xl rounded-xl font-['Dancing Script'] bg-white/70 text-pink-800 placeholder-pink-400 shadow-inner outline-none border border-pink-200 focus:ring-2 focus:ring-pink-300"
                                />
                                <textarea
                                    rows={10}
                                    placeholder="Let your heart write freely here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    className="w-full p-5 text-lg rounded-xl font-['Dancing Script'] bg-white/70 text-pink-700 placeholder-pink-400 shadow-inner outline-none border border-pink-200 resize-none overflow-y-auto"
                                />
                                <div className="flex justify-between mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-md"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold shadow-md transition-all duration-300"
                                    >
                                        {editingId ? "Update Letter 💌" : "Send It With Love 💖"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Floating Heart Trail */}
            <AnimatePresence>
                {trail.map(({x, y, id}) => (
                    <motion.div
                        key={id}
                        initial={{opacity: 0, scale: 0.6}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.4}}
                        transition={{duration: 0.4}}
                        className="fixed z-50 pointer-events-none select-none"
                        style={{
                            left: x,
                            top: y,
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <div className="text-pink-400 text-xl">💗</div>
                    </motion.div>
                ))}
            </AnimatePresence>
            {/* Static romantic background for dark mode */}
            {darkMode && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {[
                        { top: "5%", left: "10%", emoji: "💙" },
                        { top: "12%", left: "75%", emoji: "💐" },
                        { top: "20%", left: "35%", emoji: "🌸" },
                        { top: "28%", left: "60%", emoji: "💞" },
                        { top: "35%", left: "20%", emoji: "🌹" },
                        { top: "45%", left: "85%", emoji: "💜" },
                        { top: "52%", left: "5%", emoji: "🌼" },
                        { top: "60%", left: "50%", emoji: "💞" },
                        { top: "68%", left: "75%", emoji: "🌸" },
                        { top: "72%", left: "30%", emoji: "🌹" },
                        { top: "80%", left: "60%", emoji: "💙" },
                        { top: "88%", left: "15%", emoji: "💐" },
                    ].map(({ top, left, emoji }, i) => (
                        <div
                            key={i}
                            className="absolute text-3xl sm:text-4xl opacity-20 select-none"
                            style={{ top, left }}
                        >
                            {emoji}
                        </div>
                    ))}
                </div>
            )}
            {showKeyPrompt && (
                <div className="fixed inset-0 bg-pink-100/90 flex items-center justify-center z-[999]">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border-2 border-pink-200">
                        <div className="text-4xl mb-4 font-['Pacifico'] text-pink-600">💌 Enter Your Love Key</div>
                        <p className="mb-4 text-pink-500">Only those with the secret may read these love letters...</p>
                        <input
                            type="password"
                            placeholder="Enter your secret key..."
                            className="w-full p-3 mb-4 rounded-xl border border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-center text-pink-700"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSubmitKey();
                            }}
                        />
                        <button
                            onClick={handleSubmitKey}
                            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full shadow-md"
                        >
                            Unlock 💖
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
//great code agains