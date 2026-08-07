const { prisma } = require("../configs/db");

const createTodo = async (req, res) => {
  try {
    const { title, dueDate } = req.body;

    const result = await prisma.todos.create({
      data: {
        userId: req.user.id,
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Task created successfully",
      result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTodos = async (req, res) => {
  try {
    const result = await prisma.todos.findMany({
      where: { userId: req.user.id },
    });

    res.status(200).json({ status: "success", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTodo = async (req, res) => {
  try {
    const { title, dueDate } = req.body;

    const todo = await prisma.todos.findUnique({
      where: { id: req.params.id },
    });

    if (!todo) return res.status(404).json({ error: "Task not found" });

    if (todo.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    const taskUpdate = {};
    if (title !== undefined) taskUpdate.title = title;
    if (dueDate !== undefined)
      taskUpdate.dueDate = dueDate ? new Date(dueDate) : null;

    const result = await prisma.todos.update({
      where: { id: todo.id },
      data: taskUpdate,
    });

    res
      .status(200)
      .json({ status: "success", message: "Task updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeTodo = async (req, res) => {
  try {
    const todo = await prisma.todos.findUnique({
      where: { id: req.params.id },
    });

    if (!todo) return res.status(404).json({ error: "Task not found" });

    if (todo.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    await prisma.todos.delete({
      where: { id: todo.id },
    });

    res
      .status(200)
      .json({ status: "success", message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleDone = async (req, res) => {
  try {
    const todo = await prisma.todos.findUnique({
      where: { id: req.params.id },
    });

    if (!todo) return res.status(404).json({ error: "Task not found" });

    if (todo.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    const result = await prisma.todos.update({
      where: { id: todo.id },
      data: { isDone: !todo.isDone },
    });

    res.status(200).json({ status: "success", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createTodo, getTodos, updateTodo, removeTodo, toggleDone };
