import React, { useEffect, useMemo, useState } from "react";
import { getAttendance } from "../../services/attendanceService";

const todayDate = new Date().toISOString().split("T")[0];

function DriverAttendance() {
  const [attendanceDate, setAttendanceDate] = useState(todayDate);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceRows, setAttendanceRows] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const attendance = await getAttendance({
          subjectType: "Driver",
          date: attendanceDate,
          limit: 200
        });
        setAttendanceRows(attendance);
      } catch (_error) {
        setAttendanceRows([]);
      }
    };
    loadData();
  }, [attendanceDate]);

  const normalizedRows = useMemo(() => {
    return attendanceRows.map((row) => ({
      id: row._id || row.id,
      driverName: row.markedBy?.name || `Driver ${row.subjectId}`,
      driverRef: row.subjectId,
      attendanceType: row.attendanceType,
      status: row.status
    }));
  }, [attendanceRows]);

  const totals = useMemo(() => {
    return {
      present: normalizedRows.filter((row) => row.status === "Present").length,
      absent: normalizedRows.filter((row) => row.status === "Absent").length,
      leave: normalizedRows.filter((row) => row.status === "Leave").length
    };
  }, [normalizedRows]);

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) {
      return normalizedRows;
    }
    return normalizedRows.filter(
      (row) =>
        row.driverName.toLowerCase().includes(search) ||
        row.driverRef.toLowerCase().includes(search) ||
        row.attendanceType.toLowerCase().includes(search)
    );
  }, [searchTerm, normalizedRows]);

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
            placeholder="Search by driver name, reference, or session"
          />
        </div>

        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Driver Ref</th>
                <th>Session</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id || `${row.driverRef}-${row.attendanceType}`}>
                  <td>{row.driverName}</td>
                  <td>{row.driverRef}</td>
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

export default DriverAttendance;
