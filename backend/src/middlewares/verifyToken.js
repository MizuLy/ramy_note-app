const jwt = require("jsonwebtoken");
const { prisma } = require("../configs/db");

const verifyToken = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
    });

    if (!user) return res.status(401).json({ error: "User no longer exist" });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = verifyToken;
