import React, { useEffect, useState } from "react";
import { getMyStudentProfile } from "../../services/studentService";

function BusInchargeDetails() {
  const [inchargeInfo, setInchargeInfo] = useState({
    name: "Mr. Arun Kumar",
    staffId: "ST102",
    department: "Mechanical Engineering",
    busAssigned: "TN-45-BM-101",
    routeName: "North Loop",
    phone: "9876543210",
    email: "arun@nsacet.edu.in"
  });

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getMyStudentProfile();
        setInchargeInfo((prev) => ({
          ...prev,
          busAssigned: profile.busNumber || prev.busAssigned,
          routeName: profile.routeName || prev.routeName
        }));
      } catch (_error) {
        // Keep fallback values.
      }
    };
    load();
  }, []);

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Bus Incharge Details</h1>
        <p>Contact the bus incharge for delay, route, breakdown, or attendance issues.</p>
      </section>

      <section className="content-grid">
        <article className="panel">
          <header className="panel-header">
            <h3>Staff Information</h3>
            <span>Bus incharge profile</span>
          </header>
          <div className="distribution-list">
            <div>
              <p>
                <strong>Staff Photo</strong>
              </p>
              <p>Profile placeholder</p>
            </div>
            <div>
              <p>
                <strong>Name</strong>
              </p>
              <p>{inchargeInfo.name}</p>
            </div>
            <div>
              <p>
                <strong>Staff ID</strong>
              </p>
              <p>{inchargeInfo.staffId}</p>
            </div>
            <div>
              <p>
                <strong>Department</strong>
              </p>
              <p>{inchargeInfo.department}</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <h3>Bus Information</h3>
            <span>Assigned service details</span>
          </header>
          <div className="distribution-list">
            <div>
              <p>
                <strong>Bus Number</strong>
              </p>
              <p>{inchargeInfo.busAssigned}</p>
            </div>
            <div>
              <p>
                <strong>Route Name</strong>
              </p>
              <p>{inchargeInfo.routeName}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Contact</h3>
          <span>Reach the incharge directly for support</span>
        </header>
        <div className="distribution-list">
          <div>
            <p>
              <strong>Phone</strong>
            </p>
            <p>{inchargeInfo.phone}</p>
          </div>
          <div>
            <p>
              <strong>Email</strong>
            </p>
            <p>{inchargeInfo.email}</p>
          </div>
        </div>
        <div className="staff-quick-actions">
          <a className="btn-primary auth-link-btn" href={`tel:${inchargeInfo.phone}`}>
            Call Staff
          </a>
        </div>
      </section>
    </div>
  );
}

export default BusInchargeDetails;
