import React, { useMemo, useState } from "react";

const initialLogs = [
  {
    id: 1,
    busNumber: "TN-45-BM-101",
    driverName: "Arun Kumar",
    route: "North Loop",
    entryTime: "08:10 AM",
    exitTime: "--",
    status: "Inside Campus"
  },
  {
    id: 2,
    busNumber: "TN-45-BM-114",
    driverName: "Meena R",
    route: "City Connector",
    entryTime: "08:25 AM",
    exitTime: "04:40 PM",
    status: "Left Campus"
  },
  {
    id: 3,
    busNumber: "TN-45-BM-125",
    driverName: "Praveen S",
    route: "South Shuttle",
    entryTime: "08:35 AM",
    exitTime: "--",
    status: "Inside Campus"
  }
];

function BusEntryExitMonitoring() {
  const [logs, setLogs] = useState(initialLogs);

  const insideCampusCount = useMemo(
    () => logs.filter((log) => log.status === "Inside Campus").length,
    [logs]
  );
  const leftCampusCount = logs.length - insideCampusCount;

  const handleToggleStatus = (id) => {
    setLogs((prev) =>
      prev.map((log) => {
        if (log.id !== id) {
          return log;
        }

        if (log.status === "Inside Campus") {
          return {
            ...log,
            status: "Left Campus",
            exitTime: log.exitTime === "--" ? "05:00 PM" : log.exitTime
          };
        }

        return {
          ...log,
          status: "Inside Campus",
          exitTime: "--"
        };
      })
    );
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Bus Entry / Exit Monitoring</h1>
        <p>Track bus entry, exit, driver details, route, and live campus status.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Buses Tracked</p>
          <h2 className="metric-value">{logs.length}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Bus Inside Campus</p>
          <h2 className="metric-value">{insideCampusCount}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Bus Left Campus</p>
          <h2 className="metric-value">{leftCampusCount}</h2>
        </article>
      </section>

      <section className="panel bus-table-panel">
        <header className="panel-header">
          <h3>Live Bus Movement Status</h3>
          <span>Entry and exit monitoring by route</span>
        </header>

        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Bus Number</th>
                <th>Driver Name</th>
                <th>Route</th>
                <th>Bus Entry Time</th>
                <th>Bus Exit Time</th>
                <th>Live Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.busNumber}</td>
                  <td>{log.driverName}</td>
                  <td>{log.route}</td>
                  <td>{log.entryTime}</td>
                  <td>{log.exitTime}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        log.status === "Inside Campus" ? "status-active" : "status-inactive"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="btn-chip"
                      onClick={() => handleToggleStatus(log.id)}
                    >
                      {log.status === "Inside Campus" ? "Mark Exit" : "Mark Entry"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default BusEntryExitMonitoring;
