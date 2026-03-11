import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyStudentProfile } from "../../services/studentService";

const fallback = {
  studentName: "Student",
  department: "Department",
  busNumber: "-",
  routeName: "-",
  boardingPoint: "-"
};

function StudentDashboard() {
  const [studentInfo, setStudentInfo] = useState(fallback);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getMyStudentProfile();
        setStudentInfo(profile);
      } catch (_error) {
        setStudentInfo(fallback);
      }
    };
    loadProfile();
  }, []);

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Welcome, {studentInfo.studentName}</h1>
        <p>
          Department: {studentInfo.department} | Bus: {studentInfo.busNumber} | Route:{" "}
          {studentInfo.routeName} | Pickup Stop: {studentInfo.boardingPoint}
        </p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Bus Number</p>
          <h2 className="metric-value">{studentInfo.busNumber}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Route Name</p>
          <h2 className="metric-value">{studentInfo.routeName}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Department</p>
          <h2 className="metric-value">{studentInfo.department}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Pickup Location</p>
          <h2 className="metric-value">{studentInfo.boardingPoint}</h2>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <header className="panel-header">
            <h3>Bus Status</h3>
            <span>Latest status from operations data</span>
          </header>
          <div className="distribution-list">
            <div>
              <p>
                <strong>Current Status</strong>
              </p>
              <p>On the Way</p>
            </div>
            <div>
              <p>
                <strong>Expected Arrival</strong>
              </p>
              <p>Check transport panel</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <h3>Quick Navigation</h3>
            <span>Open student transport pages quickly</span>
          </header>
          <div className="staff-quick-actions">
            <Link className="btn-primary auth-link-btn" to="/student/my-bus">
              My Bus
            </Link>
            <Link className="btn-secondary auth-link-btn" to="/student/route-details">
              Route Details
            </Link>
            <Link className="btn-secondary auth-link-btn" to="/student/driver-details">
              Driver Details
            </Link>
            <Link className="btn-secondary auth-link-btn" to="/student/bus-incharge-details">
              Bus Incharge Details
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

export default StudentDashboard;
