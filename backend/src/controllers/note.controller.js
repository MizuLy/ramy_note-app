const { prisma } = require("../configs/db");

const createNote = async (req, res) => {
  try {
    const { title, body, tagNames } = req.body;

    const result = await prisma.notes.create({
      data: {
        title,
        userId: req.user.id,
        body,
        tags: {
          connectOrCreate: tagNames.map((name) => ({
            where: { tag: name },
            create: { tag: name },
          })),
        },
      },
      include: { tags: true },
    });

    res.status(201).json({
      status: "success",
      message: "Note created successfully!",
      data: {
        id: result.id,
        userId: result.userId,
        title: title,
        body: body,
        tags: result.tags,
        isPinned: result.isPinned,
        createdAt: result.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getNotes = async (req, res) => {
  try {
    const result = await prisma.notes.findMany({
      where: {
        OR: [
          { userId: req.user.id }, // condition 1: they own it
          { editors: { some: { id: req.user.id } } }, // condition 2: they're an editor
        ],
      },
      include: { tags: true },
      orderBy: { isPinned: "desc" }, // false = 0, true = 1 so desc takes from bottom first
    });

    res.status(200).json({ status: "success", result });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateNote = async (req, res) => {
  try {
    const { title, body, tagNames } = req.body;

    const noteResult = await prisma.notes.findUnique({
      where: { id: req.params.id },
      include: { editors: true },
    });

    if (!noteResult) return res.status(404).json({ error: "Note not found" });

    const isOwner = noteResult.userId === req.user.id;
    const isEditor = noteResult.editors.some((e) => e.id === req.user.id);

    if (!isOwner && !isEditor) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this note" });
    }

    const noteUpdate = {};
    if (title !== undefined) noteUpdate.title = title;
    if (body !== undefined) noteUpdate.body = body;
    if (tagNames !== undefined)
      noteUpdate.tags = {
        set: [], // clear exisitng connection first
        connectOrCreate: tagNames.map((name) => ({
          where: { tag: name },
          create: { tag: name },
        })),
      };

    const result = await prisma.notes.update({
      where: { id: noteResult.id },
      data: noteUpdate,
      include: { tags: true },
    });

    res.status(200).json({
      status: "success",
      message: "Note updated successfully!",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const togglePin = async (req, res) => {
  try {
    const pinResult = await prisma.notes.findUnique({
      where: { id: req.params.id },
    });

    if (!pinResult) return res.status(404).json({ error: "Note not found" });

    if (pinResult.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to remove this note" });
    }

    const result = await prisma.notes.update({
      where: { id: pinResult.id },
      data: { isPinned: !pinResult.isPinned },
    });

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const removeNote = async (req, res) => {
  try {
    const noteResult = await prisma.notes.findUnique({
      where: { id: req.params.id },
    });

    if (!noteResult) return res.status(404).json({ error: "Note not found" });

    if (noteResult.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to remove this note" });
    }

    await prisma.notes.delete({
      where: { id: noteResult.id },
    });

    res
      .status(200)
      .json({ status: "success", message: "Note deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createNote, getNotes, updateNote, togglePin, removeNote };
