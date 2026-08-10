const express = require("express");
const {
  getJournals,
  createJournal,
  updateJournal,
  removeJournal,
  getJournalId,
  restoreJournal,
  permanentDeleteJournal,
} = require("../controllers/journal.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.get("/", verifyToken, getJournals);
router.post("/", verifyToken, createJournal);
router.put("/:id", verifyToken, updateJournal);
router.delete("/:id", verifyToken, removeJournal);
router.get("/:id", verifyToken, getJournalId);
router.patch("/:id/restore", verifyToken, restoreJournal);
router.delete("/:id/permanent", verifyToken, permanentDeleteJournal);

module.exports = router;
