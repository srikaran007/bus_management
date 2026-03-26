import React from "react";

function BusEntryExit() {
  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Bus Entry / Exit</h1>
        <p>Entry/Exit logs are now auto-generated from bus GPS device movement.</p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Auto GPS Monitoring</h3>
          <span>No manual submission required</span>
        </header>
        <div className="bus-form">
          <p>Bus GPS pings are processed automatically by the server geofence:</p>
          <p>
            1. Outside to inside campus: <strong>Entry log auto-created</strong>
          </p>
          <p>
            2. Inside to outside campus: <strong>Exit log auto-completed</strong>
          </p>
          <p>Contact transport admin if GPS device data is not syncing.</p>
        </div>
      </section>
    </div>
  );
}

export default BusEntryExit;
