import React, { useEffect, useMemo, useState } from "react";
import { createRoute, deleteRoute, getRoutes, updateRoute } from "../../services/routeService";
import { getBuses } from "../../services/busService";

const initialForm = {
  routeId: "",
  routeName: "",
  startingPoint: "",
  endingPoint: "",
  stops: "",
  assignedBus: ""
};

function ManageRoutes() {
  const [formData, setFormData] = useState(initialForm);
  const [routes, setRoutes] = useState([]);
  const [busOptions, setBusOptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);
  const totalRoutes = routes.length;
  const assignedRoutes = useMemo(
    () => routes.filter((route) => route.assignedBus).length,
    [routes]
  );
  const unassignedRoutes = totalRoutes - assignedRoutes;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [routeRows, busRows] = await Promise.all([getRoutes(), getBuses()]);
        setRoutes(routeRows);
        setBusOptions(
          busRows.map((bus) => ({
            id: bus._id || bus.id,
            label: `${bus.busNumber} - ${bus.busName || "Bus"}`
          }))
        );
      } catch (_error) {
        // Keep page interactive with empty local view.
      }
    };
    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleAddOrUpdate = async (event) => {
    event.preventDefault();
    if (!formData.routeId.trim() || !formData.routeName.trim()) return;

    const payload = {
      routeId: formData.routeId,
      routeName: formData.routeName,
      startingPoint: formData.startingPoint,
      endingPoint: formData.endingPoint,
      stops: formData.stops
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      assignedBus: formData.assignedBus || undefined
    };

    if (isEditing) {
      try {
        const updated = await updateRoute(editingId, payload);
        setRoutes((prev) => prev.map((route) => (route._id === editingId ? updated : route)));
        setSelectedRoute((prev) => (prev && prev._id === editingId ? updated : prev));
      } catch (_error) {
        setRoutes((prev) =>
          prev.map((route) => (route._id === editingId ? { ...route, ...payload } : route))
        );
      }
      resetForm();
      return;
    }

    try {
      const created = await createRoute(payload);
      setRoutes((prev) => [created, ...prev]);
    } catch (_error) {
      const local = { _id: `local-${Date.now()}`, ...payload };
      setRoutes((prev) => [local, ...prev]);
    }
    resetForm();
  };

  const handleEdit = (route) => {
    setEditingId(route._id);
    setFormData({
      routeId: route.routeId || "",
      routeName: route.routeName || "",
      startingPoint: route.startingPoint || "",
      endingPoint: route.endingPoint || "",
      stops: Array.isArray(route.stops) ? route.stops.join(", ") : route.stops || "",
      assignedBus: route.assignedBus?._id || route.assignedBus || ""
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteRoute(id);
    } catch (_error) {
      // Fallback below.
    }
    setRoutes((prev) => prev.filter((route) => route._id !== id));
    if (selectedRoute && selectedRoute._id === id) setSelectedRoute(null);
    if (editingId === id) resetForm();
  };

  const handleView = (route) => {
    setSelectedRoute(route);
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Route Management</h1>
        <p>Create, update, and remove bus routes.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Routes</p>
          <h2 className="metric-value">{totalRoutes}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Assigned Bus</p>
          <h2 className="metric-value">{assignedRoutes}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Unassigned</p>
          <h2 className="metric-value">{unassignedRoutes}</h2>
        </article>
      </section>

      <section className="manage-buses-grid">
        <article className="panel bus-form-panel">
          <header className="panel-header">
            <h3>{isEditing ? "Edit Route" : "Add Route"}</h3>
            <span>{isEditing ? "Update route details" : "Create a new route"}</span>
          </header>

          <form className="bus-form" onSubmit={handleAddOrUpdate}>
            <label>
              Route ID
              <input type="text" name="routeId" value={formData.routeId} onChange={handleChange} />
            </label>
            <label>
              Route Name
              <input type="text" name="routeName" value={formData.routeName} onChange={handleChange} />
            </label>
            <label>
              Starting Point
              <input
                type="text"
                name="startingPoint"
                value={formData.startingPoint}
                onChange={handleChange}
              />
            </label>
            <label>
              Ending Point
              <input
                type="text"
                name="endingPoint"
                value={formData.endingPoint}
                onChange={handleChange}
              />
            </label>
            <label>
              Stops (comma separated)
              <textarea name="stops" value={formData.stops} onChange={handleChange} rows="3" />
            </label>
            <label>
              Assigned Bus
              <select name="assignedBus" value={formData.assignedBus} onChange={handleChange}>
                <option value="">Unassigned</option>
                {busOptions.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="bus-form-actions">
              <button className="btn-primary" type="submit">
                {isEditing ? "Update Route" : "Add Route"}
              </button>
              <button className="btn-secondary" type="button" onClick={resetForm}>
                Clear
              </button>
            </div>
          </form>
        </article>

        <article className="panel bus-table-panel">
          <header className="panel-header">
            <h3>Route List</h3>
            <span>{routes.length} records</span>
          </header>
          <div className="table-wrap">
            <table className="bus-table">
              <thead>
                <tr>
                  <th>Route ID</th>
                  <th>Route Name</th>
                  <th>Starting Point</th>
                  <th>Ending Point</th>
                  <th>Stops</th>
                  <th>Assigned Bus</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route._id}>
                    <td>{route.routeId}</td>
                    <td>{route.routeName}</td>
                    <td>{route.startingPoint}</td>
                    <td>{route.endingPoint}</td>
                    <td>{Array.isArray(route.stops) ? route.stops.join(", ") : route.stops}</td>
                    <td>{route.assignedBus?.busNumber || "-"}</td>
                    <td className="actions-cell">
                      <button type="button" className="btn-chip" onClick={() => handleView(route)}>
                        View
                      </button>
                      <button type="button" className="btn-chip" onClick={() => handleEdit(route)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-chip btn-delete"
                        onClick={() => handleDelete(route._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {selectedRoute ? (
        <section className="panel bus-details-panel">
          <header className="panel-header">
            <h3>View Route Details</h3>
            <span>Selected route information</span>
          </header>
          <div className="bus-details-grid">
            <p>
              <strong>Route ID:</strong> {selectedRoute.routeId}
            </p>
            <p>
              <strong>Route Name:</strong> {selectedRoute.routeName}
            </p>
            <p>
              <strong>Starting Point:</strong> {selectedRoute.startingPoint}
            </p>
            <p>
              <strong>Ending Point:</strong> {selectedRoute.endingPoint}
            </p>
            <p>
              <strong>Stops:</strong>{" "}
              {Array.isArray(selectedRoute.stops) ? selectedRoute.stops.join(", ") : selectedRoute.stops}
            </p>
            <p>
              <strong>Assigned Bus:</strong> {selectedRoute.assignedBus?.busNumber || "Unassigned"}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default ManageRoutes;
