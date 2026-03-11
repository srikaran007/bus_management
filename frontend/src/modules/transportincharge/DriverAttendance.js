import React, { useEffect, useMemo, useState } from "react";
import { getDrivers } from "../../services/driverService";
import { getAttendance } from "../../services/attendanceService";

const todayDate = new Date().toISOString().split("T")[0];

function DriverAttendance() {
  const [attendanceDate, setAttendanceDate] = useState(todayDate);
  const [searchTerm, setSearchTerm] = useState("");
  const [driverRows, setDriverRows] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [drivers, attendance] = await Promise.all([
          getDrivers({ limit: 200 }),
          getAttendance({ subjectType: "Driver", date: attendanceDate, limit: 200 })
        ]);
        setDriverRows(
          drivers.map((driver) => ({
            driverId: driver.driverId,
            driverName: driver.driverName,
            busAssigned: driver.assignedBus?.busNumber || "-"
          }))
        );
        setAttendanceRows(attendance);
      } catch (_error) {
        setDriverRows([]);
        setAttendanceRows([]);
      }
    };
    loadData();
  }, [attendanceDate]);

  const attendanceMap = useMemo(() => {
    const map = {};
    attendanceRows.forEach((row) => {
      map[row.subjectId] = row.status;
    });
    return map;
  }, [attendanceRows]);

  const totals = useMemo(() => {
    const values = Object.values(attendanceMap);
    return {
      present: values.filter((value) => value === "Present").length,
      absent: values.filter((value) => value === "Absent").length,
      leave: values.filter((value) => value === "Leave").length
    };
  }, [attendanceMap]);

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) {
      return driverRows;
    }
    return driverRows.filter(
      (row) =>
        row.driverName.toLowerCase().includes(search) ||
        row.driverId.toLowerCase().includes(search) ||
        row.busAssigned.toLowerCase().includes(search)
    );
  }, [searchTerm, driverRows]);

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Driver Attendance</h1>
        <p>View attendance submitted by drivers.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Present</p>
          <h2 className="metric-value">{totals.present}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Absent</p>
          <h2 className="metric-value">{totals.absent}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Leave</p>
          <h2 className="metric-value">{totals.leave}</h2>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Driver List Table</h3>
          <span>Attendance status submitted by drivers</span>
        </header>

        <div className="manage-buses-controls">
          <input
            type="date"
            className="bus-list-search"
            value={attendanceDate}
            onChange={(event) => setAttendanceDate(event.target.value)}
          />
          <input
            type="text"
            className="bus-list-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search driver by name, ID, or bus"
          />
        </div>

        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Driver ID</th>
                <th>Bus Assigned</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.driverId}>
                  <td>{row.driverName}</td>
                  <td>{row.driverId}</td>
                  <td>{row.busAssigned}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        attendanceMap[row.driverId] === "Present"
                          ? "status-active"
                          : attendanceMap[row.driverId] === "Leave"
                          ? "status-maintenance"
                          : "status-inactive"
                      }`}
                    >
                      {attendanceMap[row.driverId]}
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

export default DriverAttendance;
