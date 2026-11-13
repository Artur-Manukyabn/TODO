const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email || "",
  todos: user.todos.map((todo) => ({
    id: todo._id ? todo._id.toString() : todo.id,
    name: todo.name || todo.text || "",
    text: todo.text || todo.name || "",
    priority: todo.priority || "medium",
    completed: Boolean(todo.completed),
    userId: user._id.toString(),
  })),
});

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required" });
    }

    if (username.trim().length < 3) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters long" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email is invalid" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: new RegExp(`^${username.trim()}$`, "i") },
        { email: email.trim().toLowerCase() },
      ],
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already exists" });
    }

    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 10),
      todos: [],
    });

    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginValue = String(email || username || "").trim();

    if (!loginValue || !password) {
      return res
        .status(400)
        .json({ message: "Email/username and password are required" });
    }

    console.log("[auth] login attempt", {
      identifierType: loginValue.includes("@") ? "email" : "username",
    });

    const user = await User.findOne({
      $or: [
        { email: loginValue.toLowerCase() },
        { username: new RegExp(`^${escapeRegExp(loginValue)}$`, "i") },
      ],
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid username/email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid username/email or password" });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || "local_todo_secret_key",
      { expiresIn: "7d" },
    );

    return res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[auth] login error:", error.message);
    return res
      .status(500)
      .json({ message: "Login failed", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.userId !== id) {
      return res
        .status(403)
        .json({ message: "You can only access your own profile" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(sanitizeUser(user));
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch user", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;

    if (req.userId !== id) {
      return res
        .status(403)
        .json({ message: "You can only update your own profile" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username) {
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3) {
        return res
          .status(400)
          .json({ message: "Username must be at least 3 characters long" });
      }

      const duplicate = await User.findOne({
        username: new RegExp(`^${trimmedUsername}$`, "i"),
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({ message: "Username already exists" });
      }

      user.username = trimmedUsername;
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: "Email is invalid" });
      }

      const duplicate = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({ message: "Email already exists" });
      }

      user.email = normalizedEmail;
    }

    if (password) {
      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters long" });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.json({
      message: "User updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.userId !== id) {
      return res
        .status(403)
        .json({ message: "You can only delete your own profile" });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete user", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
};
