import React from "react";

function DriverProfile() {
  const profile = {
    name: "Ramesh Kumar",
    driverId: "DRV-101",
    phone: "9876543210",
    license: "TN-3456789",
    experience: "8 Years"
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Driver Profile</h1>
        <p>Personal and license details.</p>
      </section>

      <section className="panel bus-details-panel">
        <header className="panel-header">
          <h3>Profile Details</h3>
          <span>Driver information record</span>
        </header>
        <div className="bus-details-grid">
          <p>
            <strong>Name:</strong> {profile.name}
          </p>
          <p>
            <strong>Driver ID:</strong> {profile.driverId}
          </p>
          <p>
            <strong>Phone:</strong> {profile.phone}
          </p>
          <p>
            <strong>License:</strong> {profile.license}
          </p>
          <p>
            <strong>Experience:</strong> {profile.experience}
          </p>
        </div>
      </section>
    </div>
  );
}

export default DriverProfile;
