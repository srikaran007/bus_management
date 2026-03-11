import React, { useState } from "react";
import { createEntryExitLog } from "../../services/attendanceService";
import { getCurrentUser } from "../../services/sessionService";

const todayDate = new Date().toISOString().split("T")[0];

function BusEntryExit() {
  const [date, setDate] = useState(todayDate);
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [route, setRoute] = useState("");
  const [driverName, setDriverName] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const user = getCurrentUser();

    try {
      await createEntryExitLog({
        busNumber: busNumber || "UNKNOWN",
        driverName: driverName || user?.name || "Driver",
        route: route || "Unassigned Route",
        entryTime: `${date}T${entryTime || "00:00"}:00.000Z`,
        ...(exitTime ? { exitTime: `${date}T${exitTime}:00.000Z` } : {})
      });
      window.alert(
        `Entry / Exit submitted\nDate: ${date}\nEntry: ${entryTime || "--"}\nExit: ${exitTime || "--"}`
      );
    } catch (_error) {
      window.alert("Entry/Exit submission failed. Check API access.");
    }
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Bus Entry / Exit</h1>
        <p>Submit daily trip entry and exit timings.</p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Entry / Exit Form</h3>
          <span>Driver self-submission</span>
        </header>
        <form className="bus-form" onSubmit={handleSubmit}>
          <label>
            Bus Number
            <input type="text" value={busNumber} onChange={(e) => setBusNumber(e.target.value)} />
          </label>
          <label>
            Route
            <input type="text" value={route} onChange={(e) => setRoute(e.target.value)} />
          </label>
          <label>
            Driver Name
            <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
          </label>
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Entry Time
            <input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
          </label>
          <label>
            Exit Time
            <input type="time" value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
          </label>
          <div className="bus-form-actions">
            <button className="btn-primary" type="submit">
              Submit Log
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default BusEntryExit;
