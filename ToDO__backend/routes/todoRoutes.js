const express = require("express");
const {
  getTodoList,
  getTodoById,
  createTodo,
  updateTodo,
  toggleTodoStatus,
  deleteTodo,
} = require("../controllers/todoController");

const router = express.Router();

router.get("/", getTodoList);
router.get("/:id", getTodoById);
router.post("/", createTodo);
router.put("/:id", updateTodo);
router.patch("/:id", toggleTodoStatus);
router.delete("/:id", deleteTodo);

module.exports = router;
