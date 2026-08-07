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
            where: { tag_userId: { tag: name, userId: req.user.id } },
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
    res.status(500).json({ error: err.message });
  }
};

const getNotes = async (req, res) => {
  try {
    const { tag, pinned, search, page = 1, limit = 10 } = req.query;

    const where = {
      AND: [
        {
          OR: [
            { userId: req.user.id },
            { editors: { some: { id: req.user.id } } },
          ],
        },
        tag ? { tags: { some: { tag } } } : {},
        pinned !== undefined ? { isPinned: pinned === "true" } : {},
        search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { body: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const result = await prisma.notes.findMany({
      where,
      include: { tags: true },
      orderBy: { isPinned: "desc" },
      skip: (page - 1) * Number(limit),
      take: Number(limit),
    });

    res.status(200).json({ status: "success", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getNoteId = async (req, res) => {
  try {
    const { id } = req.params;

    // Use findFirst to combine the Note ID with authorization checks
    const result = await prisma.notes.findFirst({
      where: {
        id: id,
        // Authorization: Must be the owner OR an authorized editor
        OR: [
          { userId: req.user.id },
          { editors: { some: { id: req.user.id } } },
        ],
      },
      include: {
        tags: true,
      },
    });

    // If note doesn't exist OR user doesn't have permission
    if (!result) {
      return res
        .status(404)
        .json({ status: "fail", message: "Note not found or unauthorized" });
    }

    res.status(200).json({ status: "success", result });
  } catch (err) {
    console.error("getNoteId error:", err);
    res.status(500).json({ error: err.message });
  }
};

// const getNotes = async (req, res) => {
//   try {
//     const result = await prisma.notes.findMany({
//       where: {
//         OR: [
//           { userId: req.user.id }, // condition 1: they own it
//           { editors: { some: { id: req.user.id } } }, // condition 2: they're an editor
//         ],
//       },
//       include: { tags: true },
//       orderBy: { isPinned: "desc" }, // false = 0, true = 1 so desc takes from bottom first
//     });

//     res.status(200).json({ status: "success", result });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

const updateNote = async (req, res) => {
  try {
    const { title, body, tagNames, folderId } = req.body;

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
          where: { tag_userId: { tag: name, userId: req.user.id } },
          create: { tag: name, userId: req.user.id },
        })),
      };
    if (folderId !== undefined) noteUpdate.folderId = folderId;

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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteId,
  updateNote,
  togglePin,
  removeNote,
};
