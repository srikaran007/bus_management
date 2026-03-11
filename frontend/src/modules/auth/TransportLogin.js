import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../services/authService";
import { setSession } from "../../services/sessionService";

function TransportLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await login(form);
      if (data.user?.role !== "transport") {
        setError("This account is not a transport account.");
        return;
      }
      setSession(data);
      navigate("/transport/dashboard");
    } catch (_error) {
      setError("Login failed. Check email/password.");
    }
  };

  return (
    <div className="auth-page-wrapper auth-role-page">
      <section className="auth-hero">
        <h1>Transport Login</h1>
        <p>Track live movement, entry/exit logs, and driver activity.</p>
      </section>

      <article className="panel auth-form-card">
        <header className="panel-header">
          <h3>Transport Portal</h3>
          <span>Use your transport account to continue.</span>
        </header>
        <form className="bus-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </label>
          {error ? <p style={{ color: "#b91c1c", margin: "4px 0 0" }}>{error}</p> : null}
          <div className="auth-role-actions">
            <button className="btn-primary auth-link-btn" type="submit">
              Login as Transport
            </button>
            <Link className="btn-secondary auth-link-btn" to="/">
              Back to Role Selection
            </Link>
          </div>
        </form>
      </article>
    </div>
  );
}

export default TransportLogin;
