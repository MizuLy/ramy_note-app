const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const {
  getTodos,
  createTodo,
  updateTodo,
  toggleDone,
  removeTodo,
} = require("../controllers/todo.controller");

const router = express.Router();

router.get("/", verifyToken, getTodos);
router.post("/", verifyToken, createTodo);
router.patch("/:id", verifyToken, updateTodo);
router.patch("/:id/toggle", verifyToken, toggleDone); // need /:id/toggle cuz there are 2 PATCH
router.delete("/:id", verifyToken, removeTodo);

module.exports = router;
