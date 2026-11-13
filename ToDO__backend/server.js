require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const todoRoutes = require("./routes/todoRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const DATABASE_URL = process.env.DATABASE_URL || process.env.MONGODB_URI;

const allowedOrigins = [
  CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

const ensureDatabaseConnection = async (req, res, next) => {
  if (!DATABASE_URL) {
    return res.status(503).json({
      status: "error",
      message:
        "Database not configured. Set DATABASE_URL in environment variables.",
    });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    return next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return res.status(503).json({
      status: "error",
      message: "Database unavailable",
    });
  }
};

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

app.use("/api", ensureDatabaseConnection);
app.use("/api/auth", authRoutes);
app.use("/api/todos", authMiddleware, todoRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    if (DATABASE_URL) {
      await connectDB();
    }

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
