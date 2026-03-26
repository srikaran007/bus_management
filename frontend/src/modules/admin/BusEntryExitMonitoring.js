import React, { useEffect, useMemo, useState } from "react";
import { getAttendance, getDriverWorkload, getEntryExitLogs } from "../../services/attendanceService";

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

function BusEntryExitMonitoring() {
  const [logs, setLogs] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [workloadRows, setWorkloadRows] = useState([]);
  const [workloadDate, setWorkloadDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [entryExitRows, attendance, workload] = await Promise.all([
          getEntryExitLogs({ limit: 200 }),
          getAttendance({ subjectType: "Driver", limit: 200 }),
          getDriverWorkload({ date: workloadDate })
        ]);
        setLogs(entryExitRows);
        setAttendanceRows(attendance);
        setWorkloadRows(workload.items || []);
      } catch (_error) {
        setLogs([]);
        setAttendanceRows([]);
        setWorkloadRows([]);
      }
    };

    loadData();
  }, [workloadDate]);

  const insideCampusCount = useMemo(() => logs.filter((log) => !log.exitTime).length, [logs]);
  const leftCampusCount = logs.length - insideCampusCount;

  const filteredLogs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return logs;
    return logs.filter(
      (log) =>
        String(log.busNumber || "")
          .toLowerCase()
          .includes(search) ||
        String(log.driverName || "")
          .toLowerCase()
          .includes(search) ||
        String(log.route || "")
          .toLowerCase()
          .includes(search)
    );
  }, [logs, searchTerm]);

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Bus Entry / Exit Monitoring</h1>
        <p>Track GPS-based bus movement logs, driver attendance, and workload metrics.</p>
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
          <h3>Bus Movement Logs</h3>
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
                <th>Driver Name</th>
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
              {filteredLogs.map((log) => (
                <tr key={log._id || log.id}>
                  <td>{log.busNumber}</td>
                  <td>{log.driverName}</td>
                  <td>{log.route}</td>
                  <td>{formatDateTime(log.entryTime)}</td>
                  <td>
                    {log.entryLatitude && log.entryLongitude
                      ? `${log.entryLatitude}, ${log.entryLongitude}`
                      : "--"}
                  </td>
                  <td>{formatDateTime(log.exitTime)}</td>
                  <td>
                    {log.exitLatitude && log.exitLongitude
                      ? `${log.exitLatitude}, ${log.exitLongitude}`
                      : "--"}
                  </td>
                  <td>{Number(log.totalDistanceKm || 0).toFixed(2)}</td>
                  <td>{Number(log.totalDriveMinutes || 0)}</td>
                  <td>{log.monitoringMethod || "Manual"}</td>
                  <td>
                    <span
                      className={`status-pill ${log.exitTime ? "status-maintenance" : "status-active"}`}
                    >
                      {log.exitTime ? "Completed" : "Running"}
                    </span>
                  </td>
                </tr>
              ))}
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

      <section className="panel bus-table-panel">
        <header className="panel-header">
          <h3>Driver Attendance Submissions</h3>
          <span>{attendanceRows.length} records</span>
        </header>

        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Reference</th>
                <th>Date</th>
                <th>Session</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRows.map((row) => (
                <tr key={row._id || row.id}>
                  <td>{row.markedBy?.name || `Driver ${row.subjectId}`}</td>
                  <td>{row.subjectId}</td>
                  <td>{String(row.date || "").slice(0, 10)}</td>
                  <td>{row.attendanceType}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        row.status === "Present"
                          ? "status-active"
                          : row.status === "Leave"
                          ? "status-maintenance"
                          : "status-inactive"
                      }`}
                    >
                      {row.status}
                    </span>
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
