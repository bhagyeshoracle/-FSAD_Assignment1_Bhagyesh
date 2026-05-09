import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("student@school.edu");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(email, password);
      const nextPath = location.state?.from || "/equipment";
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to login.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-panel">
        <h1>Welcome Back</h1>
        <p>Sign in to request equipment or process approvals.</p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="subtle">
          New user? <Link to="/register">Create an account</Link>
        </p>

        <div className="demo-credentials">
          <p>Demo accounts:</p>
          <ul>
            <li>admin@school.edu / password123</li>
            <li>staff@school.edu / password123</li>
            <li>student@school.edu / password123</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
