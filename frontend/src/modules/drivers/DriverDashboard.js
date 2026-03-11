import React from "react";
import { Link } from "react-router-dom";

function DriverDashboard() {
  const driver = {
    name: "Ramesh Kumar",
    driverId: "DRV-101",
    assignedBus: "TN-45-BM-101",
    route: "North Loop"
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Driver Dashboard</h1>
        <p>
          Welcome {driver.name} ({driver.driverId}) | Bus: {driver.assignedBus} | Route: {driver.route}
        </p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Assigned Bus</p>
          <h2 className="metric-value">{driver.assignedBus}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Route</p>
          <h2 className="metric-value">{driver.route}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Today Status</p>
          <h2 className="metric-value">On Duty</h2>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Quick Actions</h3>
          <span>Driver module shortcuts</span>
        </header>
        <div className="staff-quick-actions">
          <Link className="btn-primary auth-link-btn" to="/driver/profile">
            Driver Profile
          </Link>
          <Link className="btn-secondary auth-link-btn" to="/driver/attendance">
            Submit Attendance
          </Link>
          <Link className="btn-secondary auth-link-btn" to="/driver/entry-exit">
            Submit Entry / Exit
          </Link>
          <Link className="btn-secondary auth-link-btn" to="/driver/assigned-bus">
            Assigned Bus
          </Link>
          <Link className="btn-secondary auth-link-btn" to="/driver/route-details">
            Route Details
          </Link>
        </div>
      </section>
    </div>
  );
}

export default DriverDashboard;
