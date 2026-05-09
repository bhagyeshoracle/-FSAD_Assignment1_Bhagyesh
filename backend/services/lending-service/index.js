const path = require("path");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const { getDb } = require("../../shared/db");
const { authenticateToken, authorizeRoles } = require("../../shared/auth");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const app = express();
const port = Number(process.env.LENDING_SERVICE_PORT || 4003);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || "http://localhost:4002";
const serviceKey = process.env.SERVICE_SHARED_KEY || "assignment-service-key";
const db = getDb();

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const validateDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Invalid date format.";
  }
  if (start > end) {
    return "Start date must be on or before end date.";
  }
  return null;
};

const mapRequest = (row) => ({
  id: row.id,
  equipmentId: row.equipment_id,
  equipmentName: row.equipment_name,
  requesterId: row.requester_id,
  requesterName: row.requester_name,
  requesterRole: row.requester_role,
  quantity: row.quantity,
  startDate: row.start_date,
  endDate: row.end_date,
  status: row.status,
  approvedBy: row.approved_by,
  approverName: row.approver_name,
  remarks: row.remarks,
  issuedAt: row.issued_at,
  returnedAt: row.returned_at,
  createdAt: row.created_at,
});

app.get("/health", (_req, res) => {
  res.json({ service: "lending-service", status: "ok" });
});

app.post("/requests", authenticateToken, (req, res) => {
  const { equipmentId, quantity, startDate, endDate, remarks = "" } = req.body;
  const qty = parsePositiveInteger(quantity);

  if (!equipmentId || !qty || !startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "equipmentId, quantity, startDate, and endDate are required." });
  }

  const dateError = validateDates(startDate, endDate);
  if (dateError) {
    return res.status(400).json({ message: dateError });
  }

  axios
    .get(`${inventoryServiceUrl}/equipment/${equipmentId}`)
    .then((response) => {
      const equipment = response.data.data;
      const overlap = db
        .prepare(
          `SELECT COALESCE(SUM(quantity), 0) AS total_booked
           FROM borrow_requests
           WHERE equipment_id = ?
             AND status IN ('PENDING', 'APPROVED')
             AND NOT (date(end_date) < date(?) OR date(start_date) > date(?))`
        )
        .get(equipmentId, startDate, endDate);

      if (overlap.total_booked + qty > equipment.total_quantity) {
        return res.status(409).json({
          message:
            "Requested quantity conflicts with overlapping bookings. Try fewer units or another date range.",
        });
      }

      const info = db
        .prepare(
          `INSERT INTO borrow_requests
            (equipment_id, equipment_name, requester_id, requester_name, requester_role,
             quantity, start_date, end_date, status, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`
        )
        .run(
          equipment.id,
          equipment.name,
          req.user.id,
          req.user.name,
          req.user.role,
          qty,
          startDate,
          endDate,
          remarks
        );

      const created = db.prepare("SELECT * FROM borrow_requests WHERE id = ?").get(info.lastInsertRowid);
      return res.status(201).json({
        message: "Borrow request submitted for approval.",
        data: mapRequest(created),
      });
    })
    .catch((error) => {
      if (error.response?.status === 404) {
        return res.status(404).json({ message: "Equipment not found." });
      }
      console.error("Error while creating request:", error.message);
      return res.status(500).json({ message: "Unable to create request at this time." });
    });
});

app.get("/requests/mine", authenticateToken, (req, res) => {
  const rows = db
    .prepare(
      `SELECT *
       FROM borrow_requests
       WHERE requester_id = ?
       ORDER BY created_at DESC`
    )
    .all(req.user.id)
    .map(mapRequest);

  return res.json({ data: rows });
});

app.get("/requests", authenticateToken, authorizeRoles("staff", "admin"), (req, res) => {
  const { status = "" } = req.query;
  let query = "SELECT * FROM borrow_requests";
  const params = [];

  if (status) {
    query += " WHERE status = ?";
    params.push(String(status).toUpperCase());
  }

  query += " ORDER BY created_at DESC";
  const rows = db.prepare(query).all(...params).map(mapRequest);
  return res.json({ data: rows });
});

app.patch("/requests/:id/approve", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  const request = db.prepare("SELECT * FROM borrow_requests WHERE id = ?").get(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Request not found." });
  }
  if (request.status !== "PENDING") {
    return res.status(400).json({ message: "Only pending requests can be approved." });
  }

  try {
    await axios.patch(
      `${inventoryServiceUrl}/internal/equipment/${request.equipment_id}/decrement`,
      { quantity: request.quantity },
      { headers: { "x-service-key": serviceKey } }
    );
  } catch (error) {
    if (error.response?.status === 409) {
      return res.status(409).json({ message: "Approval failed: not enough equipment available." });
    }
    return res.status(500).json({ message: "Could not update inventory during approval." });
  }

  db.prepare(
    `UPDATE borrow_requests
     SET status = 'APPROVED',
         approved_by = ?,
         approver_name = ?,
         issued_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(req.user.id, req.user.name, req.params.id);

  const updated = db.prepare("SELECT * FROM borrow_requests WHERE id = ?").get(req.params.id);
  return res.json({ message: "Request approved.", data: mapRequest(updated) });
});

app.patch("/requests/:id/reject", authenticateToken, authorizeRoles("staff", "admin"), (req, res) => {
  const request = db.prepare("SELECT * FROM borrow_requests WHERE id = ?").get(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Request not found." });
  }
  if (request.status !== "PENDING") {
    return res.status(400).json({ message: "Only pending requests can be rejected." });
  }

  db.prepare(
    `UPDATE borrow_requests
     SET status = 'REJECTED',
         approved_by = ?,
         approver_name = ?
     WHERE id = ?`
  ).run(req.user.id, req.user.name, req.params.id);

  const updated = db.prepare("SELECT * FROM borrow_requests WHERE id = ?").get(req.params.id);
  return res.json({ message: "Request rejected.", data: mapRequest(updated) });
});

app.patch("/requests/:id/return", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  const request = db.prepare("SELECT * FROM borrow_requests WHERE id = ?").get(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Request not found." });
  }
  if (request.status !== "APPROVED") {
    return res.status(400).json({ message: "Only approved requests can be marked as returned." });
  }

  try {
    await axios.patch(
      `${inventoryServiceUrl}/internal/equipment/${request.equipment_id}/increment`,
      { quantity: request.quantity },
      { headers: { "x-service-key": serviceKey } }
    );
  } catch (error) {
    return res.status(500).json({ message: "Could not update inventory during return." });
  }

  db.prepare(
    `UPDATE borrow_requests
     SET status = 'RETURNED',
         returned_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(req.params.id);

  const updated = db.prepare("SELECT * FROM borrow_requests WHERE id = ?").get(req.params.id);
  return res.json({ message: "Request marked as returned.", data: mapRequest(updated) });
});

app.listen(port, () => {
  console.log(`Lending service running on http://localhost:${port}`);
});
