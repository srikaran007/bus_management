import React, { useEffect, useState } from "react";
import { getBuses } from "../../services/busService";
import { getMyStudentProfile } from "../../services/studentService";

function MyBus() {
  const [myBusInfo, setMyBusInfo] = useState({
    busNumber: "-",
    busModel: "-",
    capacity: "-",
    busInchargeName: "Assigned Staff",
    busInchargeNumber: "-",
    driverName: "-",
    driverPhone: "-",
    routeName: "-",
    morningPickupTime: "-",
    eveningDropTime: "-"
  });

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getMyStudentProfile();
        const buses = await getBuses({ search: profile.busNumber });
        const bus = buses.find((row) => row.busNumber === profile.busNumber) || {};
        setMyBusInfo((prev) => ({
          ...prev,
          busNumber: profile.busNumber || "-",
          busModel: bus.model || "-",
          capacity: bus.capacity || "-",
          driverName: bus.driver?.driverName || "-",
          driverPhone: bus.driver?.phone || "-",
          routeName: profile.routeName || bus.routeName || "-"
        }));
      } catch (_error) {
        // Keep fallback data.
      }
    };
    load();
  }, []);

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>My Bus</h1>
        <p>Full information about the bus assigned to you.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Bus Number</p>
          <h2 className="metric-value">{myBusInfo.busNumber}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Route Name</p>
          <h2 className="metric-value">{myBusInfo.routeName}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Driver Name</p>
          <h2 className="metric-value">{myBusInfo.driverName}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Capacity</p>
          <h2 className="metric-value">{myBusInfo.capacity}</h2>
        </article>
      </section>

      <section className="panel bus-details-panel">
        <header className="panel-header">
          <h3>Assigned Bus Details</h3>
          <span>Student transport details for daily commute</span>
        </header>
        <div className="bus-details-grid">
          <p>
            <strong>Bus Number:</strong> {myBusInfo.busNumber}
          </p>
          <p>
            <strong>Bus Model:</strong> {myBusInfo.busModel}
          </p>
          <p>
            <strong>Capacity:</strong> {myBusInfo.capacity}
          </p>
          <p>
            <strong>Driver Name:</strong> {myBusInfo.driverName}
          </p>
          <p>
            <strong>Bus Incharge Name:</strong> {myBusInfo.busInchargeName}
          </p>
          <p>
            <strong>Driver Phone:</strong> {myBusInfo.driverPhone}
          </p>
          <p>
            <strong>Bus Incharge Number:</strong> {myBusInfo.busInchargeNumber}
          </p>
          <p>
            <strong>Route Name:</strong> {myBusInfo.routeName}
          </p>
          <p>
            <strong>Morning Pickup Time:</strong> {myBusInfo.morningPickupTime}
          </p>
          <p>
            <strong>Evening Drop Time:</strong> {myBusInfo.eveningDropTime}
          </p>
        </div>
      </section>
    </div>
  );
}

export default MyBus;
