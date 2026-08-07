const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const {
  getFolders,
  createFolder,
  updateFolder,
  removeFolder,
  getFolderId,
} = require("../controllers/folder.controller");

const router = express.Router();

router.get("/", verifyToken, getFolders);
router.post("/", verifyToken, createFolder);
router.patch("/:id", verifyToken, updateFolder);
router.delete("/:id", verifyToken, removeFolder);
router.get("/:id", verifyToken, getFolderId);

module.exports = router;
