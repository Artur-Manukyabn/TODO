require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { ensureDefaultUser, readDb, writeDb } = require("./utils/db");
const { authRouter, userRouter } = require("./routes/userRoutes");
const todoRoutes = require("./routes/todoRoutes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

ensureDefaultUser();

app.use("/api/auth", authRouter);
app.use("/api/users", authMiddleware, userRouter);
app.use("/api/users", authMiddleware, todoRoutes);

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const db = readDb();
  const user = db.users.find((item) => item.id === req.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    id: user.id,
    username: user.username,
    email: user.email || "",
    todos: user.todos,
  });
});

app.get("/api/todos", authMiddleware, (req, res) => {
  const db = readDb();
  const user = db.users.find((item) => item.id === req.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json(user.todos || []);
});

app.post("/api/todos", authMiddleware, (req, res) => {
  const db = readDb();
  const user = db.users.find((item) => item.id === req.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const text = req.body.text ?? req.body.name;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ message: "Todo text cannot be empty" });
  }

  const todo = {
    id: uuidv4(),
    name: String(text).trim(),
    priority: String(req.body.priority || "medium").toLowerCase(),
    completed: Boolean(req.body.completed),
  };

  user.todos.push(todo);
  writeDb(db);

  return res.status(201).json(user.todos);
});

app.put("/api/todos/:id", authMiddleware, (req, res) => {
  const db = readDb();
  const user = db.users.find((item) => item.id === req.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const todo = user.todos.find((item) => item.id === req.params.id);
  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  if (req.body.text !== undefined) {
    const newText = String(req.body.text).trim();
    if (!newText) {
      return res.status(400).json({ message: "Todo text cannot be empty" });
    }
    todo.name = newText;
  }

  if (req.body.completed !== undefined) {
    todo.completed = Boolean(req.body.completed);
  }

  if (req.body.priority !== undefined) {
    todo.priority = String(req.body.priority).toLowerCase();
  }

  writeDb(db);
  return res.json(user.todos);
});

app.delete("/api/todos/:id", authMiddleware, (req, res) => {
  const db = readDb();
  const user = db.users.find((item) => item.id === req.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.todos = user.todos.filter((item) => item.id !== req.params.id);
  writeDb(db);
  return res.json(user.todos);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Local To-Do backend is running" });
});

app.listen(PORT, () => {
  console.log(`🚀 Local backend running on http://localhost:${PORT}`);
});
