import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAttendance } from "../../services/attendanceService";
import { getStudents } from "../../services/studentService";
import { routeStudents, staffAssignment } from "./staffAssignment";

function StaffDashboard() {
  const assignedTrip = staffAssignment;
  const [apiStudents, setApiStudents] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [students, attendance] = await Promise.all([
          getStudents({
            routeName: assignedTrip.route,
            busNumber: assignedTrip.busNumber,
            limit: 200
          }),
          getAttendance({
            subjectType: "Student",
            date: new Date().toISOString().slice(0, 10),
            limit: 500
          })
        ]);
        setApiStudents(students);
        setAttendanceRows(attendance);
      } catch (_error) {
        setApiStudents([]);
        setAttendanceRows([]);
      }
    };
    loadData();
  }, [assignedTrip.busNumber, assignedTrip.route]);

  const attendanceMap = useMemo(() => {
    const map = {};
    attendanceRows.forEach((row) => {
      map[row.subjectId] = row.status === "Present";
    });
    return map;
  }, [attendanceRows]);

  const assignedStudents = useMemo(() => {
    if (apiStudents.length) {
      return apiStudents.map((student) => ({
        name: student.studentName,
        registerNumber: student.registerNumber,
        boardingPoint: student.boardingPoint,
        present: Boolean(attendanceMap[student.registerNumber])
      }));
    }

    return routeStudents.map((student) => ({
      name: student.name,
      registerNumber: student.studentId,
      boardingPoint: student.boardingPoint,
      present: student.morningPresent
    }));
  }, [apiStudents, attendanceMap]);

  const totalStudents = assignedStudents.length;
  const presentStudents = assignedStudents.filter((student) => student.present).length;
  const attendancePercent = Math.round((presentStudents / totalStudents) * 100);

  return (
    <div className="admin-overview staff-dashboard-page">
      <section className="overview-hero">
        <h1>Welcome, {assignedTrip.staffName}</h1>
        <p>
          This dashboard shows your assigned bus, route, and the student group mapped to this trip.
        </p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Assigned Bus</p>
          <h2 className="metric-value">{assignedTrip.busNumber}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Route</p>
          <h2 className="metric-value">{assignedTrip.route}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Pickup Point</p>
          <h2 className="metric-value">{assignedTrip.pickupPoint}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Bus Timing</p>
          <h2 className="metric-value">{assignedTrip.busTiming}</h2>
        </article>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Students Using the Bus</p>
          <h2 className="metric-value">{totalStudents}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Today's Attendance</p>
          <h2 className="metric-value">{attendancePercent}%</h2>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <header className="panel-header">
            <h3>Today's Bus Status</h3>
            <span>Current movement summary</span>
          </header>
          <div className="distribution-list">
            <div>
              <p>
                <strong>Status</strong>
              </p>
              <p>{assignedTrip.busStatus}</p>
            </div>
            <div>
              <p>
                <strong>Present Students</strong>
              </p>
              <p>{presentStudents}</p>
            </div>
            <div>
              <p>
                <strong>Absent Students</strong>
              </p>
              <p>{totalStudents - presentStudents}</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <h3>Announcements</h3>
            <span>Important updates for staff</span>
          </header>
          <ul className="staff-announcement-list">
            <li>Morning attendance window closes at 09:00 AM.</li>
            <li>Route 5 has temporary pickup point change.</li>
            <li>Evening attendance closes at 06:00 PM.</li>
          </ul>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Assigned Student Set</h3>
          <span>Students mapped to {assignedTrip.busNumber}</span>
        </header>
        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Register Number</th>
                <th>Boarding Point</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {assignedStudents.map((student) => (
                <tr key={student.registerNumber}>
                  <td>{student.name}</td>
                  <td>{student.registerNumber}</td>
                  <td>{student.boardingPoint}</td>
                  <td>
                    <span className={`status-pill ${student.present ? "status-active" : "status-inactive"}`}>
                      {student.present ? "Present" : "Absent"}
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
          <span>Staff daily shortcuts</span>
        </header>
        <div className="staff-quick-actions">
          <Link className="btn-primary auth-link-btn" to="/staff/student-bus-list">
            View Student Bus List
          </Link>
          <Link className="btn-secondary auth-link-btn" to="/staff/view-routes">
            View Routes
          </Link>
          <Link className="btn-secondary auth-link-btn" to="/staff/student-attendance">
            Mark Attendance (Morning)
          </Link>
          <Link className="btn-secondary auth-link-btn" to="/staff/student-attendance">
            Mark Attendance (Evening)
          </Link>
        </div>
      </section>
    </div>
  );
}

export default StaffDashboard;
