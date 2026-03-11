import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBuses } from "../../services/busService";
import { getDrivers } from "../../services/driverService";
import { getAttendance, getEntryExitLogs } from "../../services/attendanceService";

function TransportinchargeDashboard() {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [busRows, driverRows, attendanceRows, logRows] = await Promise.all([
          getBuses({ limit: 200 }),
          getDrivers({ limit: 200 }),
          getAttendance({ limit: 200, subjectType: "Driver" }),
          getEntryExitLogs({ limit: 200 })
        ]);
        setBuses(busRows);
        setDrivers(driverRows);
        setAttendance(attendanceRows);
        setLogs(logRows);
      } catch (_error) {
        setBuses([]);
        setDrivers([]);
        setAttendance([]);
        setLogs([]);
      }
    };
    loadData();
  }, []);

  const summary = useMemo(() => {
    const activeBuses = buses.filter((bus) => bus.status === "Active").length;
    const today = new Date().toISOString().slice(0, 10);
    const presentDrivers = attendance.filter(
      (row) => row.status === "Present" && row.subjectType === "Driver" && row.date?.slice(0, 10) === today
    ).length;
    return {
      totalBuses: buses.length,
      activeBuses,
      driversPresent: presentDrivers,
      studentsTransported: logs.length * 25
    };
  }, [buses, attendance, logs]);

  const busStatusRows = useMemo(
    () =>
      buses.slice(0, 10).map((bus) => ({
        busNo: bus.busNumber,
        route: bus.routeName || "-",
        status: bus.status === "Active" ? "Running" : bus.status,
        driver: bus.driver?.driverName || "-",
        busInchargeName: "Assigned Staff",
        busInchargePhone: "-"
      })),
    [buses]
  );

  const recentLogs = useMemo(() => {
    const latestEntry = logs.find((row) => row.entryTime);
    const latestExit = logs.find((row) => row.exitTime);
    return [
      {
        time: latestEntry ? new Date(latestEntry.entryTime).toLocaleTimeString() : "--",
        event: "Last Bus Entry",
        detail: latestEntry ? `${latestEntry.busNumber} entered campus gate.` : "No entries yet."
      },
      {
        time: latestExit ? new Date(latestExit.exitTime).toLocaleTimeString() : "--",
        event: "Last Bus Exit",
        detail: latestExit ? `${latestExit.busNumber} exited campus gate.` : "No exits yet."
      },
      {
        time: "--",
        event: "Late Bus Alert",
        detail: "Configure threshold alerts in backend monitoring."
      }
    ];
  }, [logs]);

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Transport Incharge Dashboard</h1>
        <p>Monitor driver-submitted attendance and entry/exit logs in one place.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Buses</p>
          <h2 className="metric-value">{summary.totalBuses}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Active Buses</p>
          <h2 className="metric-value">{summary.activeBuses}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Drivers Present</p>
          <h2 className="metric-value">{summary.driversPresent}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Students Transported Today</p>
          <h2 className="metric-value">{summary.studentsTransported}</h2>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <header className="panel-header">
            <h3>Quick Statistics</h3>
            <span>Bus running, driver attendance, and entry/exit summary</span>
          </header>
          <div className="distribution-list">
            <div>
              <p>
                <strong>Bus Running Status</strong>
              </p>
              <p>41 running | 7 stopped</p>
            </div>
            <div>
              <p>
                <strong>Driver Attendance Status</strong>
              </p>
              <p>
                {summary.driversPresent} present | {Math.max(drivers.length - summary.driversPresent, 0)} absent
              </p>
            </div>
            <div>
              <p>
                <strong>Entry / Exit Logs Today</strong>
              </p>
              <p>
                {logs.filter((row) => row.entryTime).length} entries | {logs.filter((row) => row.exitTime).length} exits
              </p>
            </div>
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <h3>Recent Activity</h3>
            <span>Latest movement and alert events</span>
          </header>
          <ul className="activity-list">
            {recentLogs.map((log) => (
              <li key={`${log.time}-${log.event}`}>
                <time>{log.time}</time>
                <p>
                  <strong>{log.event}:</strong> {log.detail}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Bus Status Table</h3>
          <span>Current assigned buses and running condition</span>
        </header>
        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Bus No</th>
                <th>Route</th>
                <th>Driver</th>
                <th>Bus Incharge</th>
                <th>Incharge Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {busStatusRows.map((row) => (
                <tr key={row.busNo}>
                  <td>{row.busNo}</td>
                  <td>{row.route}</td>
                  <td>{row.driver}</td>
                  <td>{row.busInchargeName}</td>
                  <td>{row.busInchargePhone}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        row.status === "Running" ? "status-active" : "status-maintenance"
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

      <section className="panel">
        <header className="panel-header">
          <h3>Quick Actions</h3>
          <span>Monitoring shortcuts</span>
        </header>
        <div className="staff-quick-actions">
          <Link className="btn-primary auth-link-btn" to="/transport/bus-status">
            View Bus Status
          </Link>
          <Link className="btn-secondary auth-link-btn" to="/transport/driver-attendance">
            View Driver Attendance
          </Link>
          <Link className="btn-secondary auth-link-btn" to="/transport/entry-exit">
            View Entry / Exit Logs
          </Link>
        </div>
      </section>
    </div>
  );
}

export default TransportinchargeDashboard;
