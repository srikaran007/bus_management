import React, { useState } from "react";
import { markAttendance } from "../../services/attendanceService";
import { getCurrentUser } from "../../services/sessionService";

const todayDate = new Date().toISOString().split("T")[0];

function DriverAttendance() {
  const [date, setDate] = useState(todayDate);
  const [session, setSession] = useState("Morning");
  const [status, setStatus] = useState("Present");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    const rawSubjectId = user?.id ?? user?._id;
    const subjectId = rawSubjectId != null ? String(rawSubjectId) : "driver-self";

    try {
      await markAttendance({
        date: `${date}T00:00:00.000Z`,
        attendanceType: session,
        subjectType: "Driver",
        subjectId,
        status
      });
      window.alert(`Attendance submitted\nDate: ${date}\nSession: ${session}\nStatus: ${status}`);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Attendance submission failed. Check API access.";
      window.alert(`Attendance submission failed.\n${message}`);
    }
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Driver Attendance</h1>
        <p>Submit your daily attendance.</p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Attendance Form</h3>
          <span>Morning or evening submission</span>
        </header>
        <form className="bus-form" onSubmit={handleSubmit}>
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Session
            <select value={session} onChange={(e) => setSession(e.target.value)}>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
            </select>
          </label>
          <div className="bus-form-actions">
            <button className="btn-primary" type="submit">
              Submit Attendance
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default DriverAttendance;
