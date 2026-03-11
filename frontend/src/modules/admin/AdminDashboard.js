import React from "react";

const metricCards = [
  { title: "Total Buses", value: "48", accent: "metric-accent-red" },
  { title: "Total Drivers", value: "62", accent: "metric-accent-light" },
  { title: "Total Students Using Bus", value: "1,286", accent: "metric-accent-light" },
  { title: "Active Routes", value: "27", accent: "metric-accent-teal" }
];

const recentActivity = [
  { time: "09:05 AM", text: "Bus TN-45-BM-102 entered campus gate A." },
  { time: "09:12 AM", text: "Driver Arjun Kumar marked present for Route 7." },
  { time: "09:21 AM", text: "Bus TN-45-BM-145 exited from gate C." },
  { time: "09:30 AM", text: "Driver Meera S updated delay for Route 12." }
];

function AdminDashboard() {
  return (
    <div className="admin-overview">
      <section className="overview-hero">
        <h1>Welcome back, Admin</h1>
        <p>Main overview page for bus operations and campus movement.</p>
      </section>

      <section className="metrics-grid">
        {metricCards.map((metric) => (
          <article key={metric.title} className={`metric-card ${metric.accent}`}>
            <p className="metric-title">{metric.title}</p>
            <h2 className="metric-value">{metric.value}</h2>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel">
          <header className="panel-header">
            <h3>Today&apos;s Bus Status</h3>
            <span>Live snapshot</span>
          </header>
          <div className="status-ring-wrap">
            <div className="status-ring" />
            <div className="status-legend">
              <p>
                <span className="dot teal" />
                On Time: 34
              </p>
              <p>
                <span className="dot red" />
                Delayed: 10
              </p>
              <p>
                <span className="dot gray" />
                Not Started: 4
              </p>
            </div>
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <h3>Bus Usage Statistics</h3>
            <span>Daily trend</span>
          </header>
          <div className="bar-chart">
            <div style={{ height: "58%" }} />
            <div style={{ height: "76%" }} />
            <div style={{ height: "62%" }} />
            <div style={{ height: "89%" }} />
            <div style={{ height: "70%" }} />
            <div style={{ height: "83%" }} />
            <div style={{ height: "66%" }} />
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <h3>Route Distribution</h3>
            <span>Allocation</span>
          </header>
          <div className="distribution-list">
            <div>
              <p>Urban Routes</p>
              <strong>40%</strong>
            </div>
            <div>
              <p>Semi-Urban Routes</p>
              <strong>35%</strong>
            </div>
            <div>
              <p>Rural Routes</p>
              <strong>25%</strong>
            </div>
          </div>
        </article>

        <article className="panel activity-panel">
          <header className="panel-header">
            <h3>Recent Activity</h3>
            <span>Bus entry / exit logs and driver updates</span>
          </header>
          <ul className="activity-list">
            {recentActivity.map((item) => (
              <li key={`${item.time}-${item.text}`}>
                <time>{item.time}</time>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

export default AdminDashboard;
