const express = require("express");
const {
  refresh,
  register,
  login,
  logout,
  getUser,
} = require("../controllers/auth.controller");
const verifyToken = require("../middlewares/verifyToken");
const { authLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/refresh", refresh);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/current-user", verifyToken, getUser);

module.exports = router;
