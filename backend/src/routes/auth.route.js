const express = require("express");
const {
  refresh,
  register,
  login,
  logout,
  getUser,
  changeName,
  changeEmail,
  changePassword,
  changeAvatar,
} = require("../controllers/auth.controller");
const verifyToken = require("../middlewares/verifyToken");
const { authLimiter } = require("../middlewares/rateLimiter");
const upload = require("../configs/upload");

const router = express.Router();

router.post("/refresh", refresh);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/current-user", verifyToken, getUser);
router.patch("/change-name", verifyToken, changeName);
router.patch("/change-email", verifyToken, changeEmail);
router.patch("/change-password", verifyToken, changePassword);
router.patch(
  "/change-avatar",
  verifyToken,
  upload.single("image"),
  changeAvatar,
);

module.exports = router;
