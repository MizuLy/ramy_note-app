const express = require("express");
const {
  refresh,
  register,
  login,
  logout,
} = require("../controllers/auth.controller");
const { authLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/refresh", refresh);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);

module.exports = router;
