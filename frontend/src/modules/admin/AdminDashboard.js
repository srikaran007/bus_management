import React, { useEffect, useMemo, useState } from "react";
import { getDashboardSummary } from "../../services/adminService";
import { getCurrentUser } from "../../services/sessionService";

function AdminDashboard() {
  const [summary, setSummary] = useState({ totals: {}, institutions: [], scope: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = getCurrentUser();

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getDashboardSummary();
        setSummary(data);
      } catch (_error) {
        setError("Unable to load dashboard summary.");
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const totals = summary.totals || {};

  const subtitle = useMemo(() => {
    if (summary.scope === "all_institutions") {
      return "Overall operational snapshot across all institutions.";
    }

    const institutionName = summary.institution || currentUser?.institution || "your institution";
    return `Operational snapshot for ${institutionName}.`;
  }, [summary.scope, summary.institution, currentUser]);

  return (
    <div className="admin-overview admin-dashboard-page">
      <section className="overview-hero">
        <h1>Admin Dashboard</h1>
        <p>{subtitle}</p>
      </section>

      {error ? <p className="error-message">{error}</p> : null}

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Buses</p>
          <h2 className="metric-value">{loading ? "-" : totals.totalBuses || 0}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Total Drivers</p>
          <h2 className="metric-value">{loading ? "-" : totals.totalDrivers || 0}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Total Students</p>
          <h2 className="metric-value">{loading ? "-" : totals.totalStudents || 0}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Running Trips</p>
          <h2 className="metric-value">{loading ? "-" : totals.runningTrips || 0}</h2>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Institution-Wise Summary</h3>
          <span>
            {summary.scope === "all_institutions"
              ? "All institutions overview"
              : "Your institution overview"}
          </span>
        </header>
        <div className="table-wrap">
          <table className="bus-table institution-wise-table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Buses</th>
                <th>Active Buses</th>
                <th>Drivers</th>
                <th>Students</th>
                <th>Routes</th>
                <th>Running Trips</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">Loading dashboard data...</td>
                </tr>
              ) : summary.institutions?.length ? (
                summary.institutions.map((row) => (
                  <tr key={row.institution}>
                    <td>{row.institution}</td>
                    <td>{row.totalBuses}</td>
                    <td>{row.activeBuses}</td>
                    <td>{row.totalDrivers}</td>
                    <td>{row.totalStudents}</td>
                    <td>{row.totalRoutes}</td>
                    <td>{row.runningTrips}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No dashboard data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="institution-summary-grid">
        {(summary.institutions || []).map((row) => (
          <article key={`${row.institution}-card`} className="panel institution-summary-card">
            <header className="panel-header institution-summary-header">
              <h3>{row.institution}</h3>
              <span>{row.runningTrips} running trips</span>
            </header>
            <div className="institution-kpis">
              <p>
                <strong>Buses:</strong> {row.totalBuses}
              </p>
              <p>
                <strong>Active Buses:</strong> {row.activeBuses}
              </p>
              <p>
                <strong>Drivers:</strong> {row.totalDrivers}
              </p>
              <p>
                <strong>Students:</strong> {row.totalStudents}
              </p>
              <p>
                <strong>Routes:</strong> {row.totalRoutes}
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default AdminDashboard;
