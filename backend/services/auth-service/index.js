const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const { getDb } = require("../../shared/db");
const { createToken, authenticateToken } = require("../../shared/auth");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const app = express();
const port = Number(process.env.AUTH_SERVICE_PORT || 4001);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const db = getDb();

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.created_at,
});

const seedUsers = () => {
  const count = db.prepare("SELECT COUNT(*) AS total FROM users").get().total;
  if (count > 0) {
    return;
  }

  const insert = db.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
  );

  const initialUsers = [
    { name: "Admin User", email: "admin@school.edu", password: "password123", role: "admin" },
    { name: "Staff User", email: "staff@school.edu", password: "password123", role: "staff" },
    { name: "Student User", email: "student@school.edu", password: "password123", role: "student" },
  ];

  const transaction = db.transaction((users) => {
    users.forEach((user) => {
      const hash = bcrypt.hashSync(user.password, 10);
      insert.run(user.name, user.email, hash, user.role);
    });
  });

  transaction(initialUsers);
};

seedUsers();

app.get("/health", (_req, res) => {
  res.json({ service: "auth-service", status: "ok" });
});

app.post("/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const safeRole = String(role || "student").toLowerCase();

  if (!name || !normalizedEmail || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  if (!["student", "staff"].includes(safeRole)) {
    return res.status(400).json({ message: "Role must be student or staff for self-registration." });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ message: "Email is already registered." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const info = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
    .run(name, normalizedEmail, passwordHash, safeRole);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  const token = createToken(user);

  return res.status(201).json({
    message: "Registration successful.",
    token,
    user: sanitizeUser(user),
  });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = createToken(user);
  return res.json({
    message: "Login successful.",
    token,
    user: sanitizeUser(user),
  });
});

app.get("/auth/me", authenticateToken, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({ user: sanitizeUser(user) });
});

app.listen(port, () => {
  console.log(`Auth service running on http://localhost:${port}`);
});
