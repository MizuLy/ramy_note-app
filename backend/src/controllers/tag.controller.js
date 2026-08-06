const { prisma } = require("../configs/db");

const createTag = async (req, res) => {
  try {
    const { tag } = req.body;

    const isExist = await prisma.tags.count({
      where: { tag_userId: { tag, userId: req.user.id } },
    });

    if (isExist) return res.status(400).json({ error: "Tag already existed!" });

    const result = await prisma.tags.create({
      data: { tag, userId: req.user.id },
    });

    res.status(201).json({
      message: "Tag created.",
      data: {
        id: result.id,
        tag: tag,
        createdAt: result.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error!" });
  }
};

const getTags = async (req, res) => {
  try {
    const result = await prisma.tags.findMany({
      where: { userId: req.user.id },
    });

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    res.status(500).json({ error: "Internal server error!" });
  }
};

const updateTag = async (req, res) => {
  try {
    const { tag } = req.body;

    const tagResult = await prisma.tags.findUnique({
      where: { id: req.params.id },
    });

    if (!tagResult)
      return res.status(404).json({ error: "Tag doesn't exist!" });

    const tagUpdate = {};
    if (tag !== undefined) tagUpdate.tag = tag;

    const result = await prisma.tags.update({
      where: { id: req.params.id },
      data: { tag },
    });

    res.status(200).json({ message: "Tag updated." });
  } catch (err) {
    res.status(500).json({ error: "Internal server error!" });
  }
};

const removeTag = async (req, res) => {
  try {
    const tagResult = await prisma.tags.findUnique({
      where: { id: req.params.id },
    });

    if (!tagResult)
      return res.status(404).json({ error: "Tag doesn't exist!" });

    await prisma.tags.delete({
      where: { id: tagResult.id },
    });

    res.status(200).json({ message: "Tag deleted." });
  } catch (err) {
    res.status(500).json({ error: "Internal server error!" });
  }
};

module.exports = { createTag, getTags, updateTag, removeTag };
