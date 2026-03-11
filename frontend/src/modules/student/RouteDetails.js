import React, { useEffect, useState } from "react";
import { getRoutes } from "../../services/routeService";
import { getMyStudentProfile } from "../../services/studentService";

function RouteDetails() {
  const [routeInfo, setRouteInfo] = useState({
    routeName: "-",
    estimatedTravelTime: "-"
  });
  const [stops, setStops] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getMyStudentProfile();
        const rows = await getRoutes({ search: profile.routeName });
        const route = rows.find((entry) => entry.routeName === profile.routeName);
        if (route) {
          setRouteInfo({
            routeName: route.routeName,
            estimatedTravelTime: `${Math.max((route.stops || []).length * 10, 20)} mins`
          });
          setStops(route.stops || []);
        }
      } catch (_error) {
        setStops([]);
      }
    };
    load();
  }, []);

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Route Details</h1>
        <p>View all stops and route travel information.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Route Name</p>
          <h2 className="metric-value">{routeInfo.routeName}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Total Stops</p>
          <h2 className="metric-value">{stops.length}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Estimated Travel Time</p>
          <h2 className="metric-value">{routeInfo.estimatedTravelTime}</h2>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Route Stops Timeline</h3>
          <span>Ordered stop list for this route</span>
        </header>
        <ol className="route-timeline">
          {stops.map((stop, index) => (
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
