const { prisma } = require("../configs/db");

const createFolder = async (req, res) => {
  try {
    const { name } = req.body;

    const result = await prisma.folders.create({
      data: { userId: req.user.id, name },
    });

    res.status(201).json({
      status: "success",
      message: "Folder created successfully",
      result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFolders = async (req, res) => {
  try {
    const result = await prisma.folders.findMany({
      where: { userId: req.user.id },
    });

    res.status(200).json({ status: "success", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFolderId = async (req, res) => {
  try {
    const folder = await prisma.folders.findUnique({
      where: { id: req.params.id },
      include: { note: true },
    });

    if (!folder) return res.status(404).json({ error: "Folder not found" });

    if (folder.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    res.status(200).json({ status: "success", folder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateFolder = async (req, res) => {
  try {
    const { name } = req.body;

    const folder = await prisma.folders.findUnique({
      where: { id: req.params.id },
    });

    if (!folder) return res.status(404).json({ error: "Folder not found" });

    if (folder.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    const folderUpdate = {};

    if (name !== undefined) folderUpdate.name = name;

    const result = await prisma.folders.update({
      where: { id: folder.id },
      data: folderUpdate,
    });

    res.status(200).json({
      status: "success",
      message: "Folder updated successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeFolder = async (req, res) => {
  try {
    const folder = await prisma.folders.findUnique({
      where: { id: req.params.id },
    });

    if (!folder) return res.status(404).json({ error: "Folder not found" });

    if (folder.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this folder" });
    }

    await prisma.$transaction([
      prisma.notes.updateMany({
        where: { folderId: folder.id },
        data: { folderId: null },
      }),
      prisma.folders.delete({ where: { id: folder.id } }),
    ]);

    res.status(200).json({ status: "success", message: "Folder deleted" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createFolder,
  getFolders,
  getFolderId,
  updateFolder,
  removeFolder,
};
