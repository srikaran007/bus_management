import React, { useEffect, useMemo, useState } from "react";
import { markAttendance } from "../../services/attendanceService";
import { getStudents } from "../../services/studentService";
import { routeStudents, staffAssignment } from "./staffAssignment";

const todayDate = new Date().toISOString().split("T")[0];

function StudentAttendance() {
  const [date, setDate] = useState(todayDate);
  const [attendanceType, setAttendanceType] = useState("Morning");
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
            route: student.routeName,
            busNumber: student.busNumber,
            boardingPoint: student.boardingPoint
          }))
        );
      } catch (_error) {
        setApiStudents([]);
      }
    };
    loadStudents();
  }, []);

  const students = useMemo(() => {
    const source = apiStudents.length ? apiStudents : routeStudents;
    return source.filter(
      (student) =>
        student.route === staffAssignment.route && student.busNumber === staffAssignment.busNumber
    );
  }, [apiStudents]);

  const [attendanceMap, setAttendanceMap] = useState(() =>
    students.reduce((acc, student) => ({ ...acc, [student.studentId]: student.morningPresent }), {})
  );

  const syncAttendanceByType = (type) => {
    setAttendanceType(type);
    setAttendanceMap(
      students.reduce(
        (acc, student) => ({ ...acc, [student.studentId]: type === "Morning" ? student.morningPresent : student.eveningPresent }),
        {}
      )
    );
  };

  const handleTogglePresent = (studentId) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSaveAttendance = async () => {
    const presentCount = students.filter((student) => attendanceMap[student.studentId]).length;
    try {
      await Promise.all(
        students.map((student) =>
          markAttendance({
            date: `${date}T00:00:00.000Z`,
            attendanceType,
            subjectType: "Student",
            subjectId: student.studentId,
            status: attendanceMap[student.studentId] ? "Present" : "Absent"
          })
        )
      );
      window.alert(
        `Attendance Saved\nBus: ${staffAssignment.busNumber}\nDate: ${date}\nType: ${attendanceType}\nPresent: ${presentCount}/${students.length}`
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Attendance save failed. Check API connectivity.";
      window.alert(`Attendance save failed.\n${message}`);
    }
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Student Attendance</h1>
        <p>
          Mark attendance for assigned bus <strong>{staffAssignment.busNumber}</strong> on route{" "}
          <strong>{staffAssignment.route}</strong>.
        </p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Attendance Details</h3>
          <span>Morning/Evening attendance for bus students</span>
        </header>

        <div className="manage-buses-controls">
          <input type="text" className="bus-list-search" value={staffAssignment.busNumber} readOnly />
          <input type="date" className="bus-list-search" value={date} onChange={(e) => setDate(e.target.value)} />
          <select
            className="manage-buses-filter-select"
            value={attendanceType}
            onChange={(e) => syncAttendanceByType(e.target.value)}
          >
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Boarding Point</th>
                <th>Present</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.studentId}>
                  <td>
                    {student.name} ({student.studentId})
                  </td>
                  <td>{student.boardingPoint}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(attendanceMap[student.studentId])}
                      onChange={() => handleTogglePresent(student.studentId)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bus-form-actions" style={{ padding: "14px 16px 16px", marginTop: 0 }}>
          <button type="button" className="btn-primary" onClick={handleSaveAttendance}>
            Save Attendance
          </button>
        </div>
      </section>
    </div>
  );
}

export default StudentAttendance;
