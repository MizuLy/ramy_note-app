const express = require("express");
const {
  createNote,
  getNotes,
  updateNote,
  togglePin,
  removeNote,
} = require("../controllers/note.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/", verifyToken, createNote);
router.get("/", verifyToken, getNotes);
router.put("/:id", verifyToken, updateNote);
router.patch("/:id", verifyToken, togglePin);
router.delete("/:id", verifyToken, removeNote);

module.exports = router;
