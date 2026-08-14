const { prisma } = require("../configs/db");

const createNote = async (req, res) => {
  try {
    const { title, body, tagNames, folderId } = req.body;

    const data = {
      title,
      userId: req.user.id,
      body,
      tags: {
        connectOrCreate: (tagNames || []).map((name) => ({
          where: { tag_userId: { tag: name, userId: req.user.id } },
          create: { tag: name, userId: req.user.id },
        })),
      },
    };

    if (folderId) {
      const folder = await prisma.folders.findFirst({
        where: { id: folderId, userId: req.user.id },
      });
      if (!folder) {
        return res.status(400).json({ error: "Invalid folder" });
      }
      data.folderId = folderId;
    }

    const result = await prisma.notes.create({
      data,
      include: { tags: true },
    });

    res.status(201).json({
      status: "success",
      message: "Note created successfully!",
      data: {
        id: result.id,
        userId: result.userId,
        title: result.title,
        body: result.body,
        tags: result.tags,
        isPinned: result.isPinned,
        folderId: result.folderId,
        createdAt: result.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getNotes = async (req, res) => {
  try {
    const { tag, pinned, search, page = 1, limit = 500, trash } = req.query;
    const inTrash = trash === "true";

    const where = {
      AND: [
        {
          OR: [
            { userId: req.user.id },
            { editors: { some: { id: req.user.id } } },
          ],
        },
        { isDeleted: inTrash },
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
    const inTrash = req.query.trash === "true";

    const result = await prisma.notes.findFirst({
      where: {
        id: id,
        isDeleted: inTrash,
        OR: [
          { userId: req.user.id },
          { editors: { some: { id: req.user.id } } },
        ],
      },
      include: {
        tags: true,
        user: { select: { id: true, name: true, email: true, image: true } }, // add this
        editors: { select: { id: true, name: true, email: true, image: true } }, // useful for showing who else has access
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

    const noteUpdate = {
      updatedAt: new Date(),
    };
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

    await prisma.notes.update({
      where: { id: noteResult.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    res.status(200).json({ status: "success", message: "Note moved to trash" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const restoreNote = async (req, res) => {
  try {
    const noteResult = await prisma.notes.findUnique({
      where: { id: req.params.id },
    });

    if (!noteResult) return res.status(404).json({ error: "Note not found" });

    if (noteResult.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const result = await prisma.notes.update({
      where: { id: noteResult.id },
      data: { isDeleted: false, deletedAt: null },
      include: { tags: true },
    });

    res.status(200).json({
      status: "success",
      message: "Note restored",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const permanentDeleteNote = async (req, res) => {
  try {
    const noteResult = await prisma.notes.findUnique({
      where: { id: req.params.id },
    });

    if (!noteResult) return res.status(404).json({ error: "Note not found" });

    if (noteResult.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!noteResult.isDeleted) {
      return res
        .status(400)
        .json({ error: "Move the note to trash before deleting permanently" });
    }

    await prisma.notes.delete({
      where: { id: noteResult.id },
    });

    res.status(200).json({
      status: "success",
      message: "Note permanently deleted",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addEditor = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "A valid email is required" });
    }

    const note = await prisma.notes.findUnique({
      where: { id: req.params.id },
    });

    if (!note) return res.status(404).json({ error: "Note not found" });

    if (note.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    const userToAdd = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!userToAdd) return res.status(404).json({ error: "User not found" });

    if (userToAdd.id === req.user.id)
      return res.status(403).json({ error: "You are the owner, dummy!" });

    const result = await prisma.notes.update({
      where: { id: note.id },
      data: {
        editors: {
          connect: { id: userToAdd.id },
        },
      },
      include: { editors: true },
    });

    res.status(200).json({
      status: "success",
      message: `${userToAdd.name} now has the editor access`,
      result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeEditor = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "A valid email is required" });
    }

    const note = await prisma.notes.findUnique({
      where: { id: req.params.id },
    });

    if (!note) return res.status(404).json({ error: "Note not found" });

    if (note.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    const userToRemove = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!userToRemove) return res.status(404).json({ error: "User not found" });

    if (userToRemove.id === req.user.id)
      return res.status(403).json({ error: "You already have full access" });

    const result = await prisma.notes.update({
      where: { id: note.id },
      data: {
        editors: {
          disconnect: { id: userToRemove.id },
        },
      },
      include: { editors: true },
    });

    res.status(200).json({
      status: "success",
      message: `${userToRemove.name} has been revoked from editor`,
      result,
    });
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
  restoreNote,
  permanentDeleteNote,
  addEditor,
  removeEditor,
};
