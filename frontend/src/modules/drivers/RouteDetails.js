import React from "react";

function RouteDetails() {
  const route = {
    name: "North Loop",
    start: "Theni Old Bus Stand",
    end: "College",
    stops: ["Theni Old Bus Stand", "Periyakulam", "Devadanapatti", "College"]
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Driver Route Details</h1>
        <p>Your assigned route path and stop order.</p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>{route.name}</h3>
          <span>
            {route.start} {"->"} {route.end}
          </span>
        </header>
        <ol className="route-timeline">
          {route.stops.map((stop, index) => (
            <li key={stop} className="route-timeline-item">
              <span className="route-stop-index">{index + 1}</span>
              <span className="route-stop-name">{stop}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default RouteDetails;
