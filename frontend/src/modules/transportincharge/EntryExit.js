import React, { useEffect, useMemo, useState } from "react";
import { getDriverWorkload, getEntryExitLogs } from "../../services/attendanceService";

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
  const [workloadRows, setWorkloadRows] = useState([]);
  const [workloadDate, setWorkloadDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const [rows, workload] = await Promise.all([
          getEntryExitLogs({ limit: 100 }),
          getDriverWorkload({ date: workloadDate })
        ]);

        setLogs(
          rows.map((row) => ({
            id: row._id || row.id,
            busNumber: row.busNumber,
            driverName: row.driverName,
            route: row.route,
            entryTime: row.entryTime,
            exitTime: row.exitTime,
            entryLatitude: row.entryLatitude,
            entryLongitude: row.entryLongitude,
            exitLatitude: row.exitLatitude,
            exitLongitude: row.exitLongitude,
            totalDistanceKm: row.totalDistanceKm,
            totalDriveMinutes: row.totalDriveMinutes,
            monitoringMethod: row.monitoringMethod
          }))
        );
        setWorkloadRows(workload.items || []);
      } catch (_error) {
        setLogs([]);
        setWorkloadRows([]);
      }
    };
    loadLogs();
  }, [workloadDate]);

  const completedCount = useMemo(() => logs.filter((log) => log.exitTime).length, [logs]);
  const runningCount = logs.length - completedCount;

  const filteredLogs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) {
      return logs;
    }
    return logs.filter(
      (log) =>
        String(log.busNumber || "").toLowerCase().includes(search) ||
        String(log.driverName || "").toLowerCase().includes(search) ||
        String(log.route || "").toLowerCase().includes(search)
    );
  }, [logs, searchTerm]);

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Entry / Exit</h1>
        <p>View GPS-based entry/exit logs and driver workload tracker.</p>
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
                <th>Entry GPS</th>
                <th>Exit Time</th>
                <th>Exit GPS</th>
                <th>Distance (km)</th>
                <th>Drive Mins</th>
                <th>Method</th>
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
                    <td>
                      {log.entryLatitude && log.entryLongitude
                        ? `${log.entryLatitude}, ${log.entryLongitude}`
                        : "--"}
                    </td>
                    <td>{log.exitTime ? formatTime(new Date(log.exitTime).toTimeString().slice(0, 5)) : "--"}</td>
                    <td>
                      {log.exitLatitude && log.exitLongitude
                        ? `${log.exitLatitude}, ${log.exitLongitude}`
                        : "--"}
                    </td>
                    <td>{Number(log.totalDistanceKm || 0).toFixed(2)}</td>
                    <td>{Number(log.totalDriveMinutes || 0)}</td>
                    <td>{log.monitoringMethod || "Manual"}</td>
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

      <section className="panel bus-table-panel">
        <header className="panel-header">
          <h3>Driver Workload Tracker</h3>
          <span>{workloadRows.length} drivers</span>
        </header>
        <div className="manage-buses-controls">
          <input
            type="date"
            className="bus-list-search"
            value={workloadDate}
            onChange={(event) => setWorkloadDate(event.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Total KM</th>
                <th>Drive Minutes</th>
                <th>Total Trips</th>
                <th>Completed</th>
                <th>Running</th>
              </tr>
            </thead>
            <tbody>
              {workloadRows.length ? (
                workloadRows.map((row) => (
                  <tr key={row.driverName}>
                    <td>{row.driverName}</td>
                    <td>{Number(row.totalDistanceKm || 0).toFixed(2)}</td>
                    <td>{Number(row.totalDriveMinutes || 0)}</td>
                    <td>{row.totalTrips}</td>
                    <td>{row.completedTrips}</td>
                    <td>{row.runningTrips}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No workload data available for selected date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default EntryExit;
