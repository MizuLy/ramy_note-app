const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const isAdmin = require("../middlewares/isAdmin");
const {
  getDashboardStats,
  getAllUsers,
  getAllNotes,
  changeRole,
  removeUser,
} = require("../controllers/admin.controller");

const router = express.Router();

router.get("/dashboard-stats", verifyToken, isAdmin, getDashboardStats);
router.get("/all-users", verifyToken, isAdmin, getAllUsers);
router.get("/all-notes", verifyToken, isAdmin, getAllNotes);
router.patch("/change-user/:id/role", verifyToken, isAdmin, changeRole);
router.delete("/remove-user/:id", verifyToken, isAdmin, removeUser);

module.exports = router;
