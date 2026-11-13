const User = require("../models/User");

const validPriorities = ["low", "medium", "high"];

const serializeTodo = (todo, userId) => ({
  id: todo._id ? todo._id.toString() : todo.id,
  name: todo.name || todo.text || "",
  text: todo.text || todo.name || "",
  priority: todo.priority || "medium",
  completed: Boolean(todo.completed),
  userId,
});

const getTodoList = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { priority, completed } = req.query;
    let todos = user.todos.map((todo) =>
      serializeTodo(todo, user._id.toString()),
    );

    if (priority) {
      todos = todos.filter(
        (todo) => todo.priority === String(priority).toLowerCase(),
      );
    }

    if (completed !== undefined) {
      todos = todos.filter((todo) => todo.completed === (completed === "true"));
    }

    return res.json(todos);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch todos", error: error.message });
  }
};

const getTodoById = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const todo = user.todos.id(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    return res.json(serializeTodo(todo, user._id.toString()));
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch todo", error: error.message });
  }
};

const createTodo = async (req, res) => {
  try {
    const { text, name, priority, completed = false } = req.body;
    const todoText = text ?? name;

    if (!todoText || !String(todoText).trim()) {
      return res.status(400).json({ message: "Todo text cannot be empty" });
    }

    if (priority && !validPriorities.includes(String(priority).toLowerCase())) {
      return res
        .status(400)
        .json({ message: "Priority must be low, medium, or high" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newTodo = {
      name: String(todoText).trim(),
      text: String(todoText).trim(),
      priority: String(priority || "medium").toLowerCase(),
      completed: Boolean(completed),
      userId: user._id.toString(),
    };

    user.todos.push(newTodo);
    await user.save();

    return res
      .status(201)
      .json(user.todos.map((todo) => serializeTodo(todo, user._id.toString())));
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create todo", error: error.message });
  }
};

const updateTodo = async (req, res) => {
  try {
    const { text, name, priority, completed } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const todo = user.todos.id(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    if (text !== undefined || name !== undefined) {
      const title = text ?? name;
      if (!String(title).trim()) {
        return res.status(400).json({ message: "Todo text cannot be empty" });
      }
      todo.name = String(title).trim();
      todo.text = String(title).trim();
    }

    if (priority !== undefined) {
      const normalizedPriority = String(priority).toLowerCase();
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

    await user.save();
    return res.json(
      user.todos.map((item) => serializeTodo(item, user._id.toString())),
    );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update todo", error: error.message });
  }
};

const toggleTodoStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const todo = user.todos.id(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    todo.completed =
      req.body.completed !== undefined
        ? Boolean(req.body.completed)
        : !todo.completed;
    await user.save();

    return res.json(serializeTodo(todo, user._id.toString()));
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update todo status", error: error.message });
  }
};

const deleteTodo = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.todos = user.todos.filter(
      (item) => item._id.toString() !== req.params.id,
    );
    await user.save();

    return res.json(
      user.todos.map((item) => serializeTodo(item, user._id.toString())),
    );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete todo", error: error.message });
  }
};

module.exports = {
  getTodoList,
  getTodoById,
  createTodo,
  updateTodo,
  toggleTodoStatus,
  deleteTodo,
};
