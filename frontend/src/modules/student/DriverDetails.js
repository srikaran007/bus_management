import React, { useEffect, useState } from "react";
import { getBuses } from "../../services/busService";
import { getMyStudentProfile } from "../../services/studentService";

function DriverDetails() {
  const [driverInfo, setDriverInfo] = useState({
    name: "-",
    phone: "-",
    licenseNumber: "-",
    experience: "-",
    busNumber: "-"
  });

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getMyStudentProfile();
        const buses = await getBuses({ search: profile.busNumber });
        const bus = buses.find((row) => row.busNumber === profile.busNumber);
        const driver = bus?.driver;
        if (driver) {
          setDriverInfo({
            name: driver.driverName || "-",
            phone: driver.phone || "-",
            licenseNumber: driver.licenseNumber || "-",
            experience: driver.experience || "-",
            busNumber: profile.busNumber || "-"
          });
        }
      } catch (_error) {
        // Keep fallback data.
      }
    };
    load();
  }, []);

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Driver Details</h1>
        <p>Contact and qualification details of your assigned bus driver.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Driver Name</p>
          <h2 className="metric-value">{driverInfo.name}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Bus Number</p>
          <h2 className="metric-value">{driverInfo.busNumber}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Experience</p>
          <h2 className="metric-value">{driverInfo.experience}</h2>
        </article>
      </section>

      <section className="panel bus-details-panel">
        <header className="panel-header">
          <h3>Assigned Driver Profile</h3>
          <span>Student access to driver information</span>
        </header>
        <div className="bus-details-grid">
          <p>
            <strong>Name:</strong> {driverInfo.name}
          </p>
          <p>
            <strong>Phone:</strong> {driverInfo.phone}
          </p>
          <p>
            <strong>License Number:</strong> {driverInfo.licenseNumber}
          </p>
          <p>
            <strong>Experience:</strong> {driverInfo.experience}
          </p>
          <p>
            <strong>Bus Number:</strong> {driverInfo.busNumber}
          </p>
        </div>
      </section>
    </div>
  );
}

export default DriverDetails;
