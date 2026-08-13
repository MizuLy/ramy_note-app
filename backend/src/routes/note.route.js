const express = require("express");
const {
  createNote,
  getNotes,
  updateNote,
  togglePin,
  removeNote,
  getNoteId,
  restoreNote,
  permanentDeleteNote,
  addEditor,
  removeEditor,
} = require("../controllers/note.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/", verifyToken, createNote);
router.get("/", verifyToken, getNotes);
router.patch("/:id/restore", verifyToken, restoreNote);
router.delete("/:id/permanent", verifyToken, permanentDeleteNote);
router.get("/:id", verifyToken, getNoteId);
router.put("/:id", verifyToken, updateNote);
router.patch("/:id", verifyToken, togglePin); // this doesn't need /:id/toggle like toggleDone in todo.route.js cuz updateNote is PUT
router.delete("/:id", verifyToken, removeNote);
router.post("/:id/editors", verifyToken, addEditor);
router.delete("/:id/editors", verifyToken, removeEditor);

module.exports = router;
