import React, { useEffect, useMemo, useState } from "react";
import { getEntryExitLogs } from "../../services/attendanceService";

const formatTime = (timeValue) => {
  if (!timeValue) {
    return "--";
  }
  const [hourString, minute] = timeValue.split(":");
  const hourNum = Number(hourString);
  if (Number.isNaN(hourNum)) {
    return timeValue;
  }
  const suffix = hourNum >= 12 ? "PM" : "AM";
  const displayHour = hourNum % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
};

function EntryExit() {
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const rows = await getEntryExitLogs({ limit: 100 });
        setLogs(
          rows.map((row) => ({
            id: row._id,
            busNumber: row.busNumber,
            driverName: row.driverName,
            route: row.route,
            entryTime: row.entryTime,
            exitTime: row.exitTime
          }))
        );
      } catch (_error) {
        setLogs([]);
      }
    };
    loadLogs();
  }, []);

  const completedCount = useMemo(() => logs.filter((log) => log.exitTime).length, [logs]);
  const runningCount = logs.length - completedCount;

  const filteredLogs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) {
      return logs;
    }
    return logs.filter(
      (log) =>
        log.busNumber.toLowerCase().includes(search) ||
        log.driverName.toLowerCase().includes(search) ||
        log.route.toLowerCase().includes(search)
    );
  }, [logs, searchTerm]);

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Entry / Exit</h1>
        <p>View entry and exit logs submitted by drivers.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Logs Today</p>
          <h2 className="metric-value">{logs.length}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Completed Trips</p>
          <h2 className="metric-value">{completedCount}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Running Trips</p>
          <h2 className="metric-value">{runningCount}</h2>
        </article>
      </section>

      <section className="panel bus-table-panel">
          <header className="panel-header">
            <h3>Entry / Exit Logs Table</h3>
            <span>{filteredLogs.length} records</span>
          </header>

          <div className="manage-buses-controls">
            <input
              type="text"
              className="bus-list-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by bus number, driver, or route"
            />
          </div>

          <div className="table-wrap">
            <table className="bus-table">
              <thead>
                <tr>
                  <th>Bus Number</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Entry Time</th>
                  <th>Exit Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const status = log.exitTime ? "Completed" : "Running";
                  return (
                    <tr key={log.id}>
                      <td>{log.busNumber}</td>
                      <td>{log.driverName}</td>
                      <td>{log.route}</td>
                      <td>{formatTime(new Date(log.entryTime).toTimeString().slice(0, 5))}</td>
                      <td>{log.exitTime ? formatTime(new Date(log.exitTime).toTimeString().slice(0, 5)) : "--"}</td>
                      <td>
                        <span className={`status-pill ${status === "Running" ? "status-active" : "status-maintenance"}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      </section>
    </div>
  );
}

export default EntryExit;
