const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "assignment-secret-key";

const createToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication token is required." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission for this action." });
  }

  return next();
};

module.exports = {
  createToken,
  authenticateToken,
  authorizeRoles,
};
