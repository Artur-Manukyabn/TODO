const User = require("../models/User");

const normalizePriority = (value) => {
  if (!value) return "Medium";

  const priority = String(value).trim().toLowerCase();

  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Medium";
};

const serializeTodo = (todo) => {
  const item = todo.toObject ? todo.toObject() : todo;

  return {
    id: String(item._id),
    _id: String(item._id),
    name: item.name ?? item.text ?? "",
    text: item.text ?? item.name ?? "",
    priority: normalizePriority(item.priority),
    completed: Boolean(item.completed),
    date: {
      createdAt: item.date?.createdAt ?? item.createdAt ?? null,
      deadline: item.date?.deadline ?? item.deadline ?? null,
    },
  };
};

const serializeTodos = (todos = []) => todos.map(serializeTodo);

const getTodos = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(serializeTodos(user.todos || []));
  } catch (error) {
    return next(error);
  }
};

const getTodoById = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const todo = user.todos.id(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    return res.json(serializeTodo(todo));
  } catch (error) {
    return next(error);
  }
};

const createTodo = async (req, res, next) => {
  try {
    const { name, text, priority, completed, deadline } = req.body;
    const todoName = (name ?? text ?? "").toString().trim();
    const todoDeadline = deadline ?? req.body.date?.deadline;

    if (!todoName) {
      return res.status(400).json({ message: "Todo name is required" });
    }

    if (!todoDeadline || Number.isNaN(new Date(todoDeadline).getTime())) {
      return res.status(400).json({ message: "Valid deadline is required" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.todos.push({
      name: todoName,
      priority: normalizePriority(priority),
      completed: Boolean(completed),
      date: {
        createdAt: new Date(),
        deadline: new Date(todoDeadline),
      },
    });

    await user.save();

    return res.status(201).json(serializeTodos(user.todos));
  } catch (error) {
    return next(error);
  }
};

const updateTodo = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const todo = user.todos.id(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    if (req.body.name !== undefined || req.body.text !== undefined) {
      const nextName = (req.body.name ?? req.body.text ?? "").toString().trim();

      if (!nextName) {
        return res.status(400).json({ message: "Todo name cannot be empty" });
      }

      todo.name = nextName;
    }

    if (req.body.priority !== undefined) {
      todo.priority = normalizePriority(req.body.priority);
    }

    if (req.body.completed !== undefined) {
      todo.completed = Boolean(req.body.completed);
    }

    if (
      req.body.deadline !== undefined ||
      req.body.date?.deadline !== undefined
    ) {
      const nextDeadline = req.body.deadline ?? req.body.date.deadline;

      if (!nextDeadline || Number.isNaN(new Date(nextDeadline).getTime())) {
        return res.status(400).json({ message: "Valid deadline is required" });
      }

      todo.date = {
        ...todo.date,
        deadline: new Date(nextDeadline),
      };
    }

    await user.save();

    return res.json(serializeTodos(user.todos));
  } catch (error) {
    return next(error);
  }
};

const deleteTodo = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const todo = user.todos.id(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    user.todos.pull(req.params.id);
    await user.save();

    return res.json(serializeTodos(user.todos));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};
