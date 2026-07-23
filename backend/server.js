import dotenv from 'dotenv';
dotenv.config(); // ✅ load env FIRST

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import DocumentRoutes from './routes/documentRoutes.js';
import FlashcardRoutes from './routes/flashcardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import podcastRoutes from './routes/podcastRoutes.js';
// Debug (optional)
console.log("MONGO_URI 👉", process.env.MONGO_URI);

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Connect DB
connectDB();

// ✅ Middleware
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL // Will be defined in Render
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Request Logger
app.use((req, res, next) => {
    console.log(`[Request Logger] ${req.method} ${req.url}`);
    next();
});

// ================= ROUTES =================

// ✅ Root route (test)
app.use('/api/auth', authRoutes);
app.use('/api/documents', DocumentRoutes);
app.use('/api/flashcards', FlashcardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/podcasts', podcastRoutes);


app.get("/", (req, res) => {
    res.send("Backend is running ✅");
});

// ✅ Test API route
app.get("/api/test", (req, res) => {
    res.json({ message: "API working ✅" });
});



// ================= 404 HANDLER =================

// ❗ If no route matched → send error to errorHandler
app.use((req, res, next) => {
    const err = new Error("Route not found");
    err.statusCode = 404;
    next(err);
});



// ================= ERROR HANDLER =================

// ❗ MUST BE LAST
app.use(errorHandler);



const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});



// ================= CRASH HANDLING =================

process.on('uncaughtException', (err) => {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
});