require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { authRouter, userRouter } = require("./routes/userRoutes");
const todoRoutes = require("./routes/todoRoutes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/todo_app";

const allowedOrigins = [
  CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowedOrigin =
        allowedOrigins.includes(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin);

      if (isAllowedOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect(DATABASE_URL, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log("✅ MongoDB connected successfully");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    return false;
  }
};

app.use("/api/auth", authRouter);
app.use("/api/users", authMiddleware, userRouter);
app.use("/api/todos", authMiddleware, todoRoutes);

app.get("/api/health", async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    return res.status(503).json({
      status: "error",
      message: "Database not connected",
      database: "disconnected",
    });
  }

  return res.json({
    status: "ok",
    message: "Backend is running",
    database: "connected",
  });
});

app.get("/health", async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    return res.status(503).json({
      status: "error",
      message: "Database not connected",
      database: "disconnected",
    });
  }

  return res.json({
    status: "ok",
    message: "Backend is running",
    database: "connected",
  });
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  const User = require("./models/User");
  const user = await User.findById(req.userId).lean();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    id: user._id.toString(),
    username: user.username,
    email: user.email || "",
    todos: user.todos.map((todo) => ({
      id: todo._id.toString(),
      name: todo.name || todo.text || "",
      text: todo.text || todo.name || "",
      priority: todo.priority || "medium",
      completed: Boolean(todo.completed),
      userId: user._id.toString(),
    })),
  });
});

const startServer = async () => {
  const dbReady = await connectDB();

  if (!dbReady) {
    console.error("Server is not starting because MongoDB connection failed.");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
  });
};

startServer();
