const { prisma } = require("../configs/db");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const jwt = require("jsonwebtoken");
const { sendOtp } = require("../utils/sendMail");

// Refresh controller
const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
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
  res.cookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res
    .status(200)
    .json({ status: "success", message: "Logged out succcessful!" });
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
    res.status(500).json({ error: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: req.params.id },
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
    res.status(500).json({ error: "Internal server error" });
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

module.exports = {
  refresh,
  register,
  login,
  logout,
  changeEmail,
  changePassword,
  getUser,
};
