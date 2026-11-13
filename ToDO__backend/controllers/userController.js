const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { readDb, writeDb } = require("../utils/db");

const sanitizeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email || "",
  todos: user.todos,
});

const registerUser = (req, res) => {
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

  const db = readDb();
  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = db.users.find(
    (user) =>
      user.username.toLowerCase() === normalizedUsername.toLowerCase() ||
      user.email?.toLowerCase() === normalizedEmail,
  );

  if (existingUser) {
    return res
      .status(409)
      .json({ message: "Username or email already exists" });
  }

  const newUser = {
    id: uuidv4(),
    username: normalizedUsername,
    email: normalizedEmail,
    password: bcrypt.hashSync(password, 10),
    todos: [],
  };

  db.users.push(newUser);
  writeDb(db);

  return res.status(201).json({
    message: "User registered successfully",
    user: sanitizeUser(newUser),
  });
};

const loginUser = (req, res) => {
  const { username, email, password } = req.body;
  const loginValue = email || username;

  if (!loginValue || !password) {
    return res
      .status(400)
      .json({ message: "Email/username and password are required" });
  }

  const db = readDb();
  const user = db.users.find(
    (item) =>
      item.email?.toLowerCase() === loginValue.toLowerCase() ||
      item.username.toLowerCase() === loginValue.toLowerCase(),
  );

  if (!user) {
    return res
      .status(401)
      .json({ message: "Invalid username/email or password" });
  }

  const isMatch = bcrypt.compareSync(password, user.password);

  if (!isMatch) {
    return res
      .status(401)
      .json({ message: "Invalid username/email or password" });
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || "local_todo_secret_key",
    {
      expiresIn: "7d",
    },
  );

  return res.json({
    token,
    user: sanitizeUser(user),
  });
};

const getUserById = (req, res) => {
  const { id } = req.params;

  if (req.userId !== id) {
    return res
      .status(403)
      .json({ message: "You can only access your own profile" });
  }

  const db = readDb();
  const user = db.users.find((item) => item.id === id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json(sanitizeUser(user));
};

const updateUser = (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  if (req.userId !== id) {
    return res
      .status(403)
      .json({ message: "You can only update your own profile" });
  }

  const db = readDb();
  const user = db.users.find((item) => item.id === id);

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

    const duplicate = db.users.find(
      (item) =>
        item.id !== id &&
        item.username.toLowerCase() === trimmedUsername.toLowerCase(),
    );

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

    const duplicate = db.users.find(
      (item) => item.id !== id && item.email?.toLowerCase() === normalizedEmail,
    );

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

    user.password = bcrypt.hashSync(password, 10);
  }

  writeDb(db);

  return res.json({
    message: "User updated successfully",
    user: sanitizeUser(user),
  });
};

const deleteUser = (req, res) => {
  const { id } = req.params;

  if (req.userId !== id) {
    return res
      .status(403)
      .json({ message: "You can only delete your own profile" });
  }

  const db = readDb();
  const userIndex = db.users.findIndex((item) => item.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  db.users.splice(userIndex, 1);
  writeDb(db);

  return res.json({ message: "User deleted successfully" });
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
};
