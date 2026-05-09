import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await register(form);
      navigate("/equipment", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to register.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-panel">
        <h1>Create Account</h1>
        <p>Register as a student or staff user to access the portal.</p>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Full name
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              minLength={6}
              required
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => update("role", e.target.value)}>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="subtle">
          Already registered? <Link to="/login">Back to login</Link>
        </p>
      </section>
    </div>
  );
}
