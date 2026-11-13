const express = require("express");
const {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
} = require("../controllers/todoController");

const router = express.Router();

router.get("/", getTodos);
router.post("/", createTodo);
router.get("/:id", getTodoById);
router.put("/:id", updateTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

module.exports = router;
