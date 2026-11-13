const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const normalizePriority = (value) => {
  if (!value) return "Medium";

  const label = String(value).trim().toLowerCase();

  if (label === "high") return "High";
  if (label === "low") return "Low";
  return "Medium";
};

const buildTodoPayload = (todo) => {
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

const serializeUser = (user) => ({
  id: String(user._id),
  username: user.username,
  email: user.email,
  todos: (user.todos || []).map(buildTodoPayload),
});

const createToken = (user) =>
  jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_SECRET || "dev_secret_key",
    {
      expiresIn: "7d",
    },
  );

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !String(username).trim()) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password || String(password).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: String(username).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      todos: [],
    });

    const token = createToken(user);

    return res.status(201).json({
      token,
      user: serializeUser(user),
      message: "Registration successful",
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || "").toString().trim();

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Email or username and password are required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(user);

    return res.json({
      token,
      user: serializeUser(user),
      message: "Login successful",
    });
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(serializeUser(user));
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res) => {
  return res.json({ message: "Logged out successfully" });
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  serializeUser,
};
