const isAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied!" });
  }
  next();
};

module.exports = isAdmin;
