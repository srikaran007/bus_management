import React, { useEffect, useMemo, useState } from "react";
import { assignBusIncharge, getBusInchargeAssignments } from "../../services/adminService";

function BusInchargeAssignment() {
  const [rows, setRows] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingBusId, setSavingBusId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getBusInchargeAssignments();
      const items = response.items || [];
      const staff = response.availableStaff || [];

      setRows(items);
      setStaffOptions(staff);
      setSelected(
        items.reduce((acc, row) => {
          acc[row.id] = row.incharge?.id ? String(row.incharge.id) : "";
          return acc;
        }, {})
      );
    } catch (_error) {
      setError("Unable to load bus incharge assignment data.");
      setRows([]);
      setStaffOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const staffLabelById = useMemo(
    () =>
      new Map(
        staffOptions.map((staff) => [String(staff.id), `${staff.name} (${staff.email || "No email"})`])
      ),
    [staffOptions]
  );

  const handleAssign = async (busId) => {
    setSavingBusId(busId);
    setError("");
    setMessage("");

    try {
      const selectedId = selected[busId] || "";
      const staffUserId = selectedId ? Number(selectedId) : null;
      const response = await assignBusIncharge(busId, staffUserId);
      setMessage(response.message || "Bus incharge updated.");
      await loadData();
    } catch (_error) {
      setError("Unable to save bus incharge assignment.");
    } finally {
      setSavingBusId(null);
    }
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Bus Incharge Assignment</h1>
        <p>Assign a staff member as bus incharge for each bus.</p>
      </section>

      {error ? <p className="error-message">{error}</p> : null}
      {message ? <p style={{ color: "#0f766e", marginBottom: "12px" }}>{message}</p> : null}

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Buses</p>
          <h2 className="metric-value">{rows.length}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Assigned Incharge</p>
          <h2 className="metric-value">{rows.filter((row) => row.incharge).length}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Available Staff</p>
          <h2 className="metric-value">{staffOptions.length}</h2>
        </article>
      </section>

      <section className="panel bus-table-panel">
        <header className="panel-header">
          <h3>Assign Staff to Bus</h3>
          <span>{loading ? "Loading..." : `${rows.length} buses`}</span>
        </header>

        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Bus Number</th>
                <th>Bus Name</th>
                <th>Current Incharge</th>
                <th>Assign Staff</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.busNumber}</td>
                    <td>{row.busName}</td>
                    <td>{row.incharge?.name || "Not Assigned"}</td>
                    <td>
                      <select
                        value={selected[row.id] || ""}
                        onChange={(event) =>
                          setSelected((prev) => ({
                            ...prev,
                            [row.id]: event.target.value
                          }))
                        }
                      >
                        <option value="">-- Unassign --</option>
                        {staffOptions.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staffLabelById.get(String(staff.id))}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="btn-chip"
                        disabled={savingBusId === row.id}
                        onClick={() => handleAssign(row.id)}
                      >
                        {savingBusId === row.id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No buses found for this institution.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default BusInchargeAssignment;
