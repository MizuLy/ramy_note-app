const { prisma } = require("../configs/db");

const createJournal = async (req, res) => {
  try {
    const { title, body, mood, entryDate } = req.body;

    const result = await prisma.journals.create({
      data: { userId: req.user.id, title, body, mood, entryDate },
    });

    res.status(201).json({
      status: "success",
      message: "Journal created successfully",
      result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getJournals = async (req, res) => {
  try {
    const showTrash = req.query.trash === "true";

    const result = await prisma.journals.findMany({
      where: { userId: req.user.id, isDeleted: showTrash },
    });

    res.status(200).json({ status: "success", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getJournalId = async (req, res) => {
  try {
    const journal = await prisma.journals.findUnique({
      where: { id: req.params.id },
    });

    if (!journal) return res.status(404).json({ error: "Journal not found" });

    if (journal.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    res.status(200).json({ status: "success", journal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateJournal = async (req, res) => {
  try {
    const { title, body, mood } = req.body;

    const journal = await prisma.journals.findUnique({
      where: { id: req.params.id },
    });

    if (!journal) return res.status(404).json({ error: "Journal not found" });

    if (journal.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    const journalUpdate = {};

    if (title !== undefined) journalUpdate.title = title;
    if (body !== undefined) journalUpdate.body = body;
    if (mood !== undefined) journalUpdate.mood = mood;

    const result = await prisma.journals.update({
      where: { id: journal.id },
      data: journalUpdate,
    });

    res.status(200).json({
      status: "success",
      message: "Journal updated successfully",
      result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeJournal = async (req, res) => {
  try {
    const journal = await prisma.journals.findUnique({
      where: { id: req.params.id },
    });

    if (!journal) return res.status(404).json({ error: "Journal not found" });

    if (journal.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    await prisma.journals.update({
      where: { id: journal.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    res
      .status(200)
      .json({ status: "success", message: "Journal moved to trash" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const restoreJournal = async (req, res) => {
  try {
    const journal = await prisma.journals.findUnique({
      where: { id: req.params.id },
    });

    if (!journal) return res.status(404).json({ error: "Journal not found" });

    if (journal.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    const result = await prisma.journals.update({
      where: { id: journal.id },
      data: { isDeleted: false, deletedAt: null },
    });

    res
      .status(200)
      .json({ status: "success", message: "Journal restored", data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const permanentDeleteJournal = async (req, res) => {
  try {
    const journal = await prisma.journals.findUnique({
      where: { id: req.params.id },
    });

    if (!journal) return res.status(404).json({ error: "Journal not found" });

    if (journal.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    if (!journal.isDeleted) {
      return res.status(400).json({
        error: "Move the journal to trash before deleting permanently",
      });
    }

    await prisma.journals.delete({
      where: { id: journal.id },
    });

    res
      .status(200)
      .json({ status: "success", message: "Journal permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createJournal,
  getJournalId,
  getJournals,
  updateJournal,
  removeJournal,
  restoreJournal,
  permanentDeleteJournal,
};
