import React, { useEffect, useMemo, useState } from "react";
import { getRoutes } from "../../services/routeService";
import { assignedRoute, staffAssignment } from "./staffAssignment";

function ViewRoutes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [assignedRouteOnly, setAssignedRouteOnly] = useState([assignedRoute]);

  useEffect(() => {
    const loadAssignedRoute = async () => {
      try {
        const rows = await getRoutes({ search: staffAssignment.route });
        const exact = rows.find((route) => route.routeName === staffAssignment.route);
        if (exact) {
          setAssignedRouteOnly([
            {
              routeId: exact.routeId,
              routeName: exact.routeName,
              busNumber: exact.assignedBus?.busNumber || staffAssignment.busNumber,
              startPoint: exact.startingPoint,
              endPoint: exact.endingPoint,
              stops: exact.stops || []
            }
          ]);
        }
      } catch (_error) {
        setAssignedRouteOnly([assignedRoute]);
      }
    };
    loadAssignedRoute();
  }, []);

  const filteredRoutes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) {
      return assignedRouteOnly;
    }

    return assignedRouteOnly.filter((route) => {
      return (
        route.routeId.toLowerCase().includes(search) ||
        route.routeName.toLowerCase().includes(search) ||
        route.busNumber.toLowerCase().includes(search) ||
        route.startPoint.toLowerCase().includes(search) ||
        route.endPoint.toLowerCase().includes(search) ||
        route.stops.join(" ").toLowerCase().includes(search)
      );
    });
  }, [searchTerm, assignedRouteOnly]);

  const toggleStops = (routeId) => {
    setExpandedRouteId((prev) => (prev === routeId ? null : routeId));
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>View Routes</h1>
        <p>
          Showing only your assigned route: <strong>{staffAssignment.route}</strong> | Bus:{" "}
          <strong>{staffAssignment.busNumber}</strong>
        </p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Bus Route List</h3>
          <span>{filteredRoutes.length} routes</span>
        </header>

        <div className="manage-buses-controls">
          <input
            type="text"
            className="bus-list-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by route ID, route name, bus number, or stop"
          />
        </div>

        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Route ID</th>
                <th>Route Name</th>
                <th>Bus Number</th>
                <th>Start Point</th>
                <th>End Point</th>
                <th>Stops</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.length ? (
                filteredRoutes.map((route) => (
                  <React.Fragment key={route.routeId}>
                    <tr>
                      <td>{route.routeId}</td>
                      <td>{route.routeName}</td>
                      <td>{route.busNumber}</td>
                      <td>{route.startPoint}</td>
                      <td>{route.endPoint}</td>
                      <td>{route.stops.length} stops</td>
                      <td className="actions-cell">
                        <button type="button" className="btn-chip" onClick={() => toggleStops(route.routeId)}>
                          {expandedRouteId === route.routeId ? "Hide Stops" : "View Stops"}
                        </button>
                      </td>
                    </tr>
                    {expandedRouteId === route.routeId ? (
                      <tr>
                        <td colSpan="7">
                          <strong>Route:</strong> {route.startPoint} {"->"} {route.endPoint}
                          <ul className="staff-announcement-list">
                            {route.stops.map((stop) => (
                              <li key={`${route.routeId}-${stop}`}>{stop}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No routes found for current search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ViewRoutes;
