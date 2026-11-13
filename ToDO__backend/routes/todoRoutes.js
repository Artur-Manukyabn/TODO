const express = require("express");
const {
  getTodoList,
  createTodo,
  updateTodo,
  toggleTodoStatus,
  deleteTodo,
} = require("../controllers/todoController");

const router = express.Router();

router.get("/:userId/todos", getTodoList);
router.post("/:userId/todos", createTodo);
router.put("/:userId/todos/:todoId", updateTodo);
router.patch("/:userId/todos/:todoId", toggleTodoStatus);
router.delete("/:userId/todos/:todoId", deleteTodo);

module.exports = router;
