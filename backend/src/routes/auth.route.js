const express = require("express");
const {
  refresh,
  register,
  login,
  logout,
} = require("../controllers/auth.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/refresh", refresh);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyToken, logout);

module.exports = router;
