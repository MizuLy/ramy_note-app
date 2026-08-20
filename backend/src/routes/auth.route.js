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
  forgotPassword,
  resetPassword,
  removeMyself,
} = require("../controllers/auth.controller");
const verifyToken = require("../middlewares/verifyToken");
const { authLimiter } = require("../middlewares/rateLimiter");
const upload = require("../configs/upload");
const validateRequest = require("../middlewares/validateRequest");
const {
  registerSchema,
  loginSchema,
  changeNameSchema,
  changeEmailSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/auth.validator");

const router = express.Router();

router.post("/refresh", refresh);
router.post(
  "/register",
  validateRequest(registerSchema),
  authLimiter,
  register,
);
router.post("/login", validateRequest(loginSchema), authLimiter, login);
router.post("/logout", logout);
router.get("/current-user", verifyToken, getUser);
router.patch(
  "/change-name",
  validateRequest(changeNameSchema),
  verifyToken,
  changeName,
);
router.patch(
  "/change-email",
  validateRequest(changeEmailSchema),
  verifyToken,
  changeEmail,
);
router.patch(
  "/change-password",
  validateRequest(changePasswordSchema),
  verifyToken,
  changePassword,
);
router.patch(
  "/change-avatar",
  verifyToken,
  upload.single("image"),
  changeAvatar,
);
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  authLimiter,
  forgotPassword,
);
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  authLimiter,
  resetPassword,
);
router.delete("/remove-myself", verifyToken, removeMyself);

module.exports = router;
