const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const authRouter = express.Router();
authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);

const userRouter = express.Router();
userRouter.get("/:id", authMiddleware, getUserById);
userRouter.put("/:id", authMiddleware, updateUser);
userRouter.delete("/:id", authMiddleware, deleteUser);

module.exports = {
  authRouter,
  userRouter,
};
