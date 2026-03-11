import React from "react";
import { Link } from "react-router-dom";

const loginRoles = [
  { title: "Admin", desc: "Manage operations, users, routes, and reports.", path: "/auth/admin" },
  { title: "Staff", desc: "View routes and student bus movement lists.", path: "/auth/staff" },
  {
    title: "Transport",
    desc: "Track entry/exit, driver attendance, and bus status.",
    path: "/auth/transport"
  },
  {
    title: "Driver",
    desc: "Submit attendance, entry/exit logs, and view assigned bus route.",
    path: "/auth/driver"
  },
  { title: "Student", desc: "Check assigned bus, route, and driver details.", path: "/auth/student" }
];

function Login() {
  return (
    <div className="auth-page-wrapper">
      <section className="auth-hero">
        <h1>Bus Management System</h1>
        <p>Select your role to continue.</p>
      </section>

      <section className="auth-grid">
        {loginRoles.map((role) => (
          <article className="panel auth-role-card" key={role.title}>
            <header className="panel-header">
              <h3>{role.title} Login</h3>
              <span>{role.desc}</span>
            </header>
            <div className="auth-role-actions">
              <Link className="btn-primary auth-link-btn" to={role.path}>
                Continue as {role.title}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <div className="auth-links">
        <Link to="/auth/admin">Admin</Link>
        <Link to="/auth/staff">Staff</Link>
        <Link to="/auth/transport">Transport</Link>
        <Link to="/auth/driver">Driver</Link>
        <Link to="/auth/student">Student</Link>
      </div>
    </div>
  );
}

export default Login;
