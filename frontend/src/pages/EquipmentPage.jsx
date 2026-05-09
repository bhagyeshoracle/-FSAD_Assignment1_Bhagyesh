import { useEffect, useMemo, useState } from "react";
import { Search, CalendarPlus } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const dateToday = () => new Date().toISOString().slice(0, 10);

export function EquipmentPage() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    availableOnly: false,
  });
  const [requestForm, setRequestForm] = useState({
    equipmentId: "",
    quantity: 1,
    startDate: dateToday(),
    endDate: dateToday(),
    remarks: "",
  });

  const categories = useMemo(
    () => [...new Set(equipment.map((item) => item.category))].sort(),
    [equipment]
  );

  const fetchEquipment = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/equipment", { params: filters });
      setEquipment(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load equipment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const openRequestForm = (item) => {
    setMessage("");
    setError("");
    setRequestForm({
      equipmentId: item.id,
      quantity: 1,
      startDate: dateToday(),
      endDate: dateToday(),
      remarks: "",
    });
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await api.post("/requests", requestForm);
      setMessage("Borrow request submitted successfully.");
      setRequestForm((prev) => ({ ...prev, equipmentId: "" }));
      await fetchEquipment();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit request.");
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Equipment Dashboard</h2>
        <p>Browse items, filter by category, and create borrow requests.</p>
      </div>

      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          fetchEquipment();
        }}
      >
        <label className="inline-field grow">
          <Search size={16} />
          <input
            placeholder="Search by item name or description"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
          />
        </label>
        <label>
          Category
          <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)}>
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(e) => setFilter("availableOnly", e.target.checked)}
          />
          Available only
        </label>
        <button type="submit">Apply</button>
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
                <th>Item</th>
                <th>Category</th>
                <th>Condition</th>
                <th>Total</th>
                <th>Available</th>
                {user?.role !== "admin" && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {equipment.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <p className="row-note">{item.description || "No description"}</p>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.equipment_condition}</td>
                  <td>{item.total_quantity}</td>
                  <td>{item.available_quantity}</td>
                  {user?.role !== "admin" && (
                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={item.available_quantity <= 0}
                        onClick={() => openRequestForm(item)}
                        title="Create borrow request"
                      >
                        <CalendarPlus size={16} />
                        Request
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {equipment.length === 0 && (
                <tr>
                  <td colSpan={user?.role === "admin" ? 5 : 6}>No equipment found for current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {user?.role !== "admin" && requestForm.equipmentId && (
        <form className="request-box" onSubmit={submitRequest}>
          <h3>New Borrow Request</h3>
          <div className="grid-two">
            <label>
              Quantity
              <input
                type="number"
                min="1"
                value={requestForm.quantity}
                onChange={(e) =>
                  setRequestForm((prev) => ({ ...prev, quantity: Number(e.target.value) || 1 }))
                }
                required
              />
            </label>
            <label>
              Start date
              <input
                type="date"
                value={requestForm.startDate}
                onChange={(e) => setRequestForm((prev) => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </label>
            <label>
              End date
              <input
                type="date"
                value={requestForm.endDate}
                onChange={(e) => setRequestForm((prev) => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </label>
            <label>
              Remarks
              <input
                value={requestForm.remarks}
                onChange={(e) => setRequestForm((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder="Optional reason"
              />
            </label>
          </div>
          <div className="actions">
            <button type="submit">Submit Request</button>
            <button
              type="button"
              className="ghost"
              onClick={() => setRequestForm((prev) => ({ ...prev, equipmentId: "" }))}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
