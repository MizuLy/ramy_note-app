const jwt = require("jsonwebtoken");

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.ACCESS_SECRET, {
    expiresIn: "1d",
  });
};

const generateRefreshToken = (userId, res) => {
  const payload = { id: userId }; // data embed inside JWT token
  const token = jwt.sign(payload, process.env.REFRESH_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
  return token;
};

module.exports = { generateAccessToken, generateRefreshToken };
