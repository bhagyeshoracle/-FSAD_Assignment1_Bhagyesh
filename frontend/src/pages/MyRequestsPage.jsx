import { useEffect, useState } from "react";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";

export function MyRequestsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/requests/mine");
      setRows(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>My Borrow Requests</h2>
        <p>Track each request from submission to return completion.</p>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="subtle">Loading your requests...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Quantity</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Processed By</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.equipmentName}</td>
                  <td>{row.quantity}</td>
                  <td>{row.startDate}</td>
                  <td>{row.endDate}</td>
                  <td>
                    <StatusBadge value={row.status} />
                  </td>
                  <td>{row.approverName || "-"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6}>No borrow requests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
