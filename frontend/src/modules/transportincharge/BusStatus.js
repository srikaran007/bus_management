import React, { useEffect, useMemo, useState } from "react";
import { getBuses } from "../../services/busService";

function BusStatus() {
  const [searchTerm, setSearchTerm] = useState("");
  const [busRows, setBusRows] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const rows = await getBuses();
        setBusRows(
          rows.map((row) => ({
            id: row._id || row.id,
            busNumber: row.busNumber,
            driverName: row.driver?.driverName || "-",
            route: row.routeName || "-",
            currentStatus: row.status === "Active" ? "Running" : row.status,
            lastUpdated: new Date(row.updatedAt || row.createdAt || Date.now()).toLocaleTimeString()
          }))
        );
      } catch (_error) {
        setBusRows([]);
      }
    };
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) {
      return busRows;
    }

    return busRows.filter((row) => row.busNumber.toLowerCase().includes(search));
  }, [searchTerm, busRows]);

  const handleViewDetails = (row) => {
    window.alert(
      `Bus: ${row.busNumber}\nDriver: ${row.driverName}\nRoute: ${row.route}\nStatus: ${row.currentStatus}\nLast Updated: ${row.lastUpdated}`
    );
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Bus Status</h1>
        <p>Monitor bus movement status reported from field operations.</p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Bus Status Table</h3>
          <span>{filteredRows.length} buses</span>
        </header>

        <div className="manage-buses-controls">
          <input
            type="text"
            className="bus-list-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by bus number"
          />
        </div>

        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Bus Number</th>
                <th>Driver Name</th>
                <th>Route</th>
                <th>Current Status</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length ? (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.busNumber}</td>
                    <td>{row.driverName}</td>
                    <td>{row.route}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          row.currentStatus === "Running"
                            ? "status-active"
                            : row.currentStatus === "Idle"
                            ? "status-maintenance"
                            : "status-inactive"
                        }`}
                      >
                        {row.currentStatus}
                      </span>
                    </td>
                    <td>{row.lastUpdated}</td>
                    <td className="actions-cell">
                      <button type="button" className="btn-chip" onClick={() => handleViewDetails(row)}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No buses found for this search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default BusStatus;
