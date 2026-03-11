import React from "react";

function AssignedBus() {
  const bus = {
    busNumber: "TN-45-BM-101",
    model: "Ashok Leyland Lynx",
    route: "North Loop",
    capacity: 52
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Assigned Bus</h1>
        <p>Details of the bus assigned to you.</p>
      </section>

      <section className="panel bus-details-panel">
        <header className="panel-header">
          <h3>Bus Details</h3>
          <span>Assigned service vehicle</span>
        </header>
        <div className="bus-details-grid">
          <p>
            <strong>Bus Number:</strong> {bus.busNumber}
          </p>
          <p>
            <strong>Model:</strong> {bus.model}
          </p>
          <p>
            <strong>Route:</strong> {bus.route}
          </p>
          <p>
            <strong>Capacity:</strong> {bus.capacity}
          </p>
        </div>
      </section>
    </div>
  );
}

export default AssignedBus;
