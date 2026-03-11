import React, { useEffect, useMemo, useState } from "react";
import { getStudents } from "../../services/studentService";
import { getAttendance } from "../../services/attendanceService";
import { routeStudents, staffAssignment } from "./staffAssignment";

function StudentBusList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [apiStudents, setApiStudents] = useState([]);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const rows = await getStudents({
          routeName: staffAssignment.route,
          busNumber: staffAssignment.busNumber
        });
        setApiStudents(
          rows.map((student) => ({
            studentId: student.registerNumber,
            name: student.studentName,
            department: student.department || "-",
            busNumber: student.busNumber || "-",
            route: student.routeName || "-",
            boardingPoint: student.boardingPoint || "-"
          }))
        );
      } catch (_error) {
        setApiStudents([]);
      }
    };
    loadStudents();
  }, []);

  const assignedData = apiStudents.length ? apiStudents : routeStudents;

  const filteredStudents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return assignedData.filter((student) => {
      const matchesSearch =
        !search ||
        student.studentId.toLowerCase().includes(search) ||
        student.name.toLowerCase().includes(search) ||
        student.department.toLowerCase().includes(search) ||
        student.boardingPoint.toLowerCase().includes(search);

      return matchesSearch;
    });
  }, [searchTerm, assignedData]);

  const handleViewAttendance = async (student) => {
    try {
      const rows = await getAttendance({
        subjectType: "Student",
        subjectId: student.studentId,
        limit: 10
      });
      const summary = rows
        .slice(0, 5)
        .map((row) => `${row.attendanceType}: ${row.status}`)
        .join("\n");
      window.alert(`${student.name} (${student.studentId})\nRecent Attendance\n${summary || "No records"}`);
    } catch (_error) {
      window.alert(`${student.name} (${student.studentId})\nAttendance data unavailable.`);
    }
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Student Bus List</h1>
        <p>
          Assigned only to your route: <strong>{staffAssignment.route}</strong> | Bus:{" "}
          <strong>{staffAssignment.busNumber}</strong>
        </p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Assigned Students</h3>
          <span>{filteredStudents.length} records</span>
        </header>

        <div className="manage-buses-controls">
          <input
            type="text"
            className="bus-list-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by Student ID, Name, Department, or Boarding Point"
          />
          <input
            type="text"
            className="bus-list-search"
            value={staffAssignment.busNumber}
            readOnly
            aria-label="Assigned bus"
          />
          <input
            type="text"
            className="bus-list-search"
            value={staffAssignment.route}
            readOnly
            aria-label="Assigned route"
          />
        </div>

        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Bus No</th>
                <th>Route</th>
                <th>Boarding Point</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length ? (
                filteredStudents.map((student) => (
                  <tr key={student.studentId}>
                    <td>{student.studentId}</td>
                    <td>{student.name}</td>
                    <td>{student.department}</td>
                    <td>{student.busNumber}</td>
                    <td>{student.route}</td>
                    <td>{student.boardingPoint}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="btn-chip"
                        onClick={() => handleViewAttendance(student)}
                      >
                        View Attendance
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No students found for current search/filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default StudentBusList;
