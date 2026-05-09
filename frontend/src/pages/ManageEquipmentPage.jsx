import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api/client";

const initialForm = {
  name: "",
  category: "",
  equipment_condition: "Good",
  description: "",
  total_quantity: 1,
};

export function ManageEquipmentPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/equipment");
      setRows(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load equipment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await api.put(`/equipment/${editingId}`, form);
        setMessage("Equipment updated.");
      } else {
        await api.post("/equipment", form);
        setMessage("Equipment added.");
      }

      setForm(initialForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save equipment.");
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      category: row.category,
      equipment_condition: row.equipment_condition,
      description: row.description || "",
      total_quantity: row.total_quantity,
    });
  };

  const remove = async (id) => {
    setError("");
    setMessage("");
    try {
      await api.delete(`/equipment/${id}`);
      setMessage("Equipment deleted.");
      if (editingId === id) {
        setEditingId(null);
        setForm(initialForm);
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete equipment.");
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Manage Equipment</h2>
        <p>Add, update, and remove inventory as an administrator.</p>
      </div>

      <form className="request-box" onSubmit={onSubmit}>
        <h3>{editingId ? "Edit Equipment" : "Add Equipment"}</h3>
        <div className="grid-two">
          <label>
            Name
            <input value={form.name} onChange={(e) => setField("name", e.target.value)} required />
          </label>
          <label>
            Category
            <input
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              required
            />
          </label>
          <label>
            Condition
            <select
              value={form.equipment_condition}
              onChange={(e) => setField("equipment_condition", e.target.value)}
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Needs Service">Needs Service</option>
            </select>
          </label>
          <label>
            Total quantity
            <input
              type="number"
              min="1"
              value={form.total_quantity}
              onChange={(e) => setField("total_quantity", Number(e.target.value) || 1)}
              required
            />
          </label>
          <label className="full-width">
            Description
            <input
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Optional details"
            />
          </label>
        </div>
        <div className="actions">
          <button type="submit">{editingId ? "Update Equipment" : "Add Equipment"}</button>
          {editingId && (
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setEditingId(null);
                setForm(initialForm);
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      {loading ? (
        <p className="subtle">Loading equipment...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Condition</th>
                <th>Total</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.category}</td>
                  <td>{row.equipment_condition}</td>
                  <td>{row.total_quantity}</td>
                  <td>{row.available_quantity}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-btn" onClick={() => startEdit(row)} title="Edit">
                        <Pencil size={16} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => remove(row.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6}>No equipment records.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
