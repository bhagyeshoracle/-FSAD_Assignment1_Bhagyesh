import { useEffect, useState } from "react";
import { CheckCheck, X, Undo2 } from "lucide-react";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";

export function ApprovalsPage() {
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/requests", {
        params: statusFilter ? { status: statusFilter } : {},
      });
      setRows(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load approval queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const runAction = async (id, action) => {
    setError("");
    setMessage("");
    try {
      await api.patch(`/requests/${id}/${action}`);
      setMessage(`Request ${action}d successfully.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${action} request.`);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Approval Queue</h2>
        <p>Approve, reject, and close borrow requests after return.</p>
      </div>

      <div className="toolbar">
        <label>
          Filter by status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="RETURNED">RETURNED</option>
          </select>
        </label>
      </div>

      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      {loading ? (
        <p className="subtle">Loading requests...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Requester</th>
                <th>Role</th>
                <th>Qty</th>
                <th>Date Range</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.equipmentName}</td>
                  <td>{row.requesterName}</td>
                  <td>{row.requesterRole}</td>
                  <td>{row.quantity}</td>
                  <td>
                    {row.startDate} to {row.endDate}
                  </td>
                  <td>
                    <StatusBadge value={row.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      {row.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            className="icon-btn"
                            title="Approve request"
                            onClick={() => runAction(row.id, "approve")}
                          >
                            <CheckCheck size={16} />
                            Approve
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            title="Reject request"
                            onClick={() => runAction(row.id, "reject")}
                          >
                            <X size={16} />
                            Reject
                          </button>
                        </>
                      )}
                      {row.status === "APPROVED" && (
                        <button
                          type="button"
                          className="icon-btn"
                          title="Mark returned"
                          onClick={() => runAction(row.id, "return")}
                        >
                          <Undo2 size={16} />
                          Return
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>No requests available for selected filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
