const express = require("express");
const {
  createTag,
  getTags,
  updateTag,
  removeTag,
} = require("../controllers/tag.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/", verifyToken, createTag);
router.get("/", verifyToken, getTags);
router.patch("/:id", verifyToken, updateTag);
router.delete("/:id", verifyToken, removeTag);

module.exports = router;
