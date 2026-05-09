const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { getDb } = require("../../shared/db");
const { authenticateToken, authorizeRoles } = require("../../shared/auth");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const app = express();
const port = Number(process.env.INVENTORY_SERVICE_PORT || 4002);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const serviceKey = process.env.SERVICE_SHARED_KEY || "assignment-service-key";
const db = getDb();

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const requireServiceKey = (req, res, next) => {
  const provided = req.headers["x-service-key"];
  if (provided !== serviceKey) {
    return res.status(401).json({ message: "Unauthorized internal request." });
  }
  return next();
};

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const seedEquipment = () => {
  const count = db.prepare("SELECT COUNT(*) AS total FROM equipment").get().total;
  if (count > 0) {
    return;
  }

  const insert = db.prepare(
    `INSERT INTO equipment
      (name, category, equipment_condition, description, total_quantity, available_quantity)
      VALUES (?, ?, ?, ?, ?, ?)`
  );

  const defaultItems = [
    ["DSLR Camera Kit", "Photography", "Good", "Canon starter kit for media club", 5, 5],
    ["Chemistry Lab Glassware Set", "Laboratory", "Excellent", "Shared practical set", 12, 12],
    ["Football Training Kit", "Sports", "Good", "Balls, cones, pump and bibs", 8, 8],
    ["Arduino Starter Box", "Electronics", "Good", "Boards, sensors, jumper wires", 10, 10],
  ];

  const transaction = db.transaction((items) => {
    items.forEach((item) => insert.run(...item));
  });

  transaction(defaultItems);
};

seedEquipment();

app.get("/health", (_req, res) => {
  res.json({ service: "inventory-service", status: "ok" });
});

app.get("/equipment", (req, res) => {
  const { search = "", category = "", availableOnly = "false" } = req.query;
  const params = [];
  const filters = [];

  if (search) {
    filters.push("(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)");
    const term = `%${String(search).toLowerCase()}%`;
    params.push(term, term);
  }

  if (category) {
    filters.push("LOWER(category) = ?");
    params.push(String(category).toLowerCase());
  }

  if (String(availableOnly).toLowerCase() === "true") {
    filters.push("available_quantity > 0");
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT id, name, category, equipment_condition, description, total_quantity, available_quantity,
              created_at, updated_at
       FROM equipment
       ${whereClause}
       ORDER BY category ASC, name ASC`
    )
    .all(...params);

  return res.json({ data: rows });
});

app.get("/equipment/:id", (req, res) => {
  const item = db
    .prepare(
      `SELECT id, name, category, equipment_condition, description, total_quantity, available_quantity,
              created_at, updated_at
       FROM equipment
       WHERE id = ?`
    )
    .get(req.params.id);

  if (!item) {
    return res.status(404).json({ message: "Equipment not found." });
  }

  return res.json({ data: item });
});

app.post("/equipment", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const { name, category, equipment_condition, description = "", total_quantity } = req.body;
  const total = parsePositiveInteger(total_quantity);

  if (!name || !category || !equipment_condition || !total) {
    return res
      .status(400)
      .json({ message: "Name, category, condition, and a positive quantity are required." });
  }

  const info = db
    .prepare(
      `INSERT INTO equipment
        (name, category, equipment_condition, description, total_quantity, available_quantity)
        VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(name, category, equipment_condition, description, total, total);

  const inserted = db.prepare("SELECT * FROM equipment WHERE id = ?").get(info.lastInsertRowid);
  return res.status(201).json({ message: "Equipment added.", data: inserted });
});

app.put("/equipment/:id", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const { name, category, equipment_condition, description = "", total_quantity } = req.body;
  const total = parsePositiveInteger(total_quantity);

  if (!name || !category || !equipment_condition || !total) {
    return res
      .status(400)
      .json({ message: "Name, category, condition, and a positive quantity are required." });
  }

  const existing = db
    .prepare("SELECT id, total_quantity, available_quantity FROM equipment WHERE id = ?")
    .get(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: "Equipment not found." });
  }

  const inUse = existing.total_quantity - existing.available_quantity;
  if (total < inUse) {
    return res.status(400).json({
      message: `Cannot reduce total quantity below ${inUse} because items are currently issued.`,
    });
  }

  const nextAvailable = total - inUse;
  db.prepare(
    `UPDATE equipment
     SET name = ?, category = ?, equipment_condition = ?, description = ?, total_quantity = ?,
         available_quantity = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(name, category, equipment_condition, description, total, nextAvailable, req.params.id);

  const updated = db.prepare("SELECT * FROM equipment WHERE id = ?").get(req.params.id);
  return res.json({ message: "Equipment updated.", data: updated });
});

app.delete("/equipment/:id", authenticateToken, authorizeRoles("admin"), (req, res) => {
  const existing = db.prepare("SELECT id FROM equipment WHERE id = ?").get(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: "Equipment not found." });
  }

  const activeRequests = db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM borrow_requests
       WHERE equipment_id = ?
         AND status IN ('PENDING', 'APPROVED')`
    )
    .get(req.params.id).total;

  if (activeRequests > 0) {
    return res.status(400).json({
      message: "Cannot delete this equipment while active requests exist.",
    });
  }

  db.prepare("DELETE FROM equipment WHERE id = ?").run(req.params.id);
  return res.json({ message: "Equipment deleted." });
});

app.patch("/internal/equipment/:id/decrement", requireServiceKey, (req, res) => {
  const qty = parsePositiveInteger(req.body.quantity);
  if (!qty) {
    return res.status(400).json({ message: "A positive quantity is required." });
  }

  const item = db
    .prepare("SELECT id, available_quantity FROM equipment WHERE id = ?")
    .get(req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Equipment not found." });
  }

  if (item.available_quantity < qty) {
    return res.status(409).json({ message: "Insufficient available quantity." });
  }

  db.prepare(
    `UPDATE equipment
     SET available_quantity = available_quantity - ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(qty, req.params.id);

  return res.json({ message: "Availability reduced." });
});

app.patch("/internal/equipment/:id/increment", requireServiceKey, (req, res) => {
  const qty = parsePositiveInteger(req.body.quantity);
  if (!qty) {
    return res.status(400).json({ message: "A positive quantity is required." });
  }

  const item = db
    .prepare("SELECT id, total_quantity, available_quantity FROM equipment WHERE id = ?")
    .get(req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Equipment not found." });
  }

  const nextValue = Math.min(item.available_quantity + qty, item.total_quantity);
  db.prepare(
    `UPDATE equipment
     SET available_quantity = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(nextValue, req.params.id);

  return res.json({ message: "Availability increased." });
});

app.listen(port, () => {
  console.log(`Inventory service running on http://localhost:${port}`);
});
