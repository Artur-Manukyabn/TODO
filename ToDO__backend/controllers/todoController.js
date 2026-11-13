const { v4: uuidv4 } = require("uuid");
const { readDb, writeDb } = require("../utils/db");

const validPriorities = ["low", "medium", "high"];

const getUserByIdFromDb = (userId) => {
  const db = readDb();
  return db.users.find((user) => user.id === userId);
};

const getTodoList = (req, res) => {
  const { userId } = req.params;

  if (req.userId !== userId) {
    return res
      .status(403)
      .json({ message: "You can only access your own todos" });
  }

  const db = readDb();
  const user = db.users.find((item) => item.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { priority, completed } = req.query;
  let todos = [...user.todos];

  if (priority) {
    const normalizedPriority = priority.toLowerCase();
    todos = todos.filter((todo) => todo.priority === normalizedPriority);
  }

  if (completed !== undefined) {
    const filterValue = completed === "true";
    todos = todos.filter((todo) => todo.completed === filterValue);
  }

  return res.json(todos);
};

const createTodo = (req, res) => {
  const { userId } = req.params;
  const { name, priority, completed = false } = req.body;

  if (req.userId !== userId) {
    return res
      .status(403)
      .json({ message: "You can only create todos for your own account" });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Todo name is required" });
  }

  if (priority && !validPriorities.includes(priority.toLowerCase())) {
    return res
      .status(400)
      .json({ message: "Priority must be low, medium, or high" });
  }

  const db = readDb();
  const user = db.users.find((item) => item.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const newTodo = {
    id: uuidv4(),
    name: name.trim(),
    priority: (priority || "medium").toLowerCase(),
    completed: Boolean(completed),
  };

  user.todos.push(newTodo);
  writeDb(db);

  return res.status(201).json(newTodo);
};

const updateTodo = (req, res) => {
  const { userId, todoId } = req.params;
  const { name, priority, completed } = req.body;

  if (req.userId !== userId) {
    return res
      .status(403)
      .json({ message: "You can only update your own todos" });
  }

  const db = readDb();
  const user = db.users.find((item) => item.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const todo = user.todos.find((item) => item.id === todoId);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ message: "Todo name cannot be empty" });
    }
    todo.name = name.trim();
  }

  if (priority !== undefined) {
    const normalizedPriority = priority.toLowerCase();
    if (!validPriorities.includes(normalizedPriority)) {
      return res
        .status(400)
        .json({ message: "Priority must be low, medium, or high" });
    }
    todo.priority = normalizedPriority;
  }

  if (completed !== undefined) {
    todo.completed = Boolean(completed);
  }

  writeDb(db);
  return res.json(todo);
};

const toggleTodoStatus = (req, res) => {
  const { userId, todoId } = req.params;
  const { completed } = req.body;

  if (req.userId !== userId) {
    return res
      .status(403)
      .json({ message: "You can only change your own todo status" });
  }

  const db = readDb();
  const user = db.users.find((item) => item.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const todo = user.todos.find((item) => item.id === todoId);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  if (completed === undefined) {
    todo.completed = !todo.completed;
  } else {
    todo.completed = Boolean(completed);
  }

  writeDb(db);
  return res.json(todo);
};

const deleteTodo = (req, res) => {
  const { userId, todoId } = req.params;

  if (req.userId !== userId) {
    return res
      .status(403)
      .json({ message: "You can only delete your own todos" });
  }

  const db = readDb();
  const user = db.users.find((item) => item.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const todoIndex = user.todos.findIndex((item) => item.id === todoId);

  if (todoIndex === -1) {
    return res.status(404).json({ message: "Todo not found" });
  }

  user.todos.splice(todoIndex, 1);
  writeDb(db);

  return res.json({ message: "Todo deleted successfully", todos: user.todos });
};

module.exports = {
  getTodoList,
  createTodo,
  updateTodo,
  toggleTodoStatus,
  deleteTodo,
  getUserByIdFromDb,
};
