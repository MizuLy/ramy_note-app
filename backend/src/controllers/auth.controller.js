const { prisma } = require("../configs/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const jwt = require("jsonwebtoken");
const { sendOtp, sendResetLink } = require("../utils/sendMail");

// Refresh controller
const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, image: true, role: true },
    });

    if (!user) return res.status(401).json({ error: "User no longer exists" });

    const newAccessToken = generateAccessToken(user.id);
    res.status(200).json({ accessToken: newAccessToken, user });
  } catch (err) {
    res.status(403).json({ error: "Invalid refresh token" });
  }
};

// Register
const register = async (req, res) => {
  try {
    const { name, email, password, image } = req.body;

    const isExist = await prisma.users.findUnique({
      where: { email },
    });

    if (isExist)
      return res.status(400).json({ error: "User already existed!" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const userCount = await prisma.users.count();

    const result = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        image,
        role: userCount === 0 ? "ADMIN" : "USER",
      },
    });

    // Code sent
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Confirmation sent
    await prisma.otps.create({ data: { email, otp: otpCode, expiresAt } });
    await sendOtp(email, otpCode);

    res.status(201).json({
      status: "success",
      message:
        "Registered successful! Please verify your email before logging in...",
      data: {
        id: result.id,
        name: name,
        email: email,
        image: image,
        role: result.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (user === null)
      return res.status(404).json({ error: "User doesn't exist!" });
    if (!user.isVerified)
      return res.status(400).json({ error: "Please verify your email first" });

    const isPassword = await bcrypt.compare(password, user.password);

    if (!isPassword)
      return res.status(401).json({ error: "Invalid email or password" });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, res);

    res.status(200).json({
      status: "success",
      message: "Login successful!",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
};

// Logout
const logout = async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res
    .status(200)
    .json({ status: "success", message: "Logged out succcessful!" });
};

// Change name
const changeName = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
    });

    if (!user) return res.status(404).json({ error: "User doesn't exist" });

    const result = await prisma.users.update({
      where: { id: user.id },
      data: { name },
    });

    res.status(200).json({
      status: "success",
      message: "Name updated successfully",
      data: { result },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Change email
const changeEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
    });

    // Validate password
    const isPassword = await bcrypt.compare(password, user.password);

    if (!isPassword)
      return res.status(400).json({ error: "Incorrect password" });

    // Check if email already taken
    const isExist = await prisma.users.findUnique({
      where: { email: newEmail },
    });

    if (isExist)
      return res.status(400).json({ error: "Email already existed" });

    await prisma.users.update({
      where: { id: user.id },
      data: { email: newEmail },
    });

    res
      .status(200)
      .json({ status: "success", message: "Email has been updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
    });

    const isPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isPassword)
      return res.status(401).json({ error: "Incorrect current password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res
      .status(200)
      .json({ status: "success", message: "Password has been updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user)
      return res.status(200).json({
        status: "success",
        message: "A reset link has been sent, please check your email.",
      });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await prisma.resetTokens.deleteMany({ where: { email } }); // Clear old ones
    await prisma.resetTokens.create({ data: { email, token, expiresAt } });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendResetLink(email, resetLink);

    return res.status(200).json({
      status: "success",
      message: "A reset link has been sent, please check your email.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const record = await prisma.resetTokens.findUnique({ where: { token } });

    if (!record)
      return res.status(400).json({ error: "Invalid or expired token" });
    if (record.expiresAt < new Date())
      return res.status(400).json({ error: "Token has expired" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { email: record.email },
      data: { password: hashedPassword },
    });

    await prisma.resetTokens.delete({ where: { token } });

    res
      .status(200)
      .json({ status: "success", message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: { name: true },
    });

    res.status(200).json({ status: "success", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const changeAvatar = async (req, res) => {
  try {
    const imageUrl = req.file.path;

    await prisma.users.update({
      where: { id: req.user.id },
      data: { image: imageUrl },
    });

    res.status(200).json({ status: "success", data: { image: imageUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeMyself = async (req, res) => {
  try {
    if (req.user.role === "ADMIN")
      return res
        .status(400)
        .json({ error: "You are an ADMIN, you mustn't delete your account!" });

    await prisma.users.delete({
      where: { id: req.user.id },
    });

    res.status(200).json({ status: "success", message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  refresh,
  register,
  login,
  logout,
  changeName,
  changeEmail,
  changePassword,
  forgotPassword,
  resetPassword,
  getUser,
  changeAvatar,
  removeMyself,
};
