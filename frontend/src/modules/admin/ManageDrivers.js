import React, { useEffect, useMemo, useState } from "react";
import { createDriver, deleteDriver, getDrivers, updateDriver } from "../../services/driverService";
import { getBuses } from "../../services/busService";

const initialForm = {
  driverName: "",
  driverId: "",
  licenseNumber: "",
  phone: "",
  assignedBus: "",
  status: "Active"
};

function ManageDrivers() {
  const [formData, setFormData] = useState(initialForm);
  const [drivers, setDrivers] = useState([]);
  const [busOptions, setBusOptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);
  const totalDrivers = drivers.length;
  const activeDrivers = useMemo(
    () => drivers.filter((driver) => driver.status === "Active").length,
    [drivers]
  );
  const assignedDrivers = useMemo(
    () => drivers.filter((driver) => driver.assignedBus).length,
    [drivers]
  );
  const unassignedDrivers = totalDrivers - assignedDrivers;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [driverRows, busRows] = await Promise.all([getDrivers(), getBuses()]);
        setDrivers(driverRows);
        setBusOptions(
          busRows.map((bus) => ({
            id: bus._id || bus.id,
            label: `${bus.busNumber} - ${bus.busName || "Bus"}`
          }))
        );
      } catch (_error) {
        // Keep page usable with empty fallback.
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

    if (!formData.driverName.trim() || !formData.driverId.trim() || !formData.licenseNumber.trim()) {
      return;
    }

    if (isEditing) {
      try {
        const updated = await updateDriver(editingId, formData);
        setDrivers((prev) => prev.map((driver) => (driver._id === editingId ? updated : driver)));
        setSelectedDriver((prev) => (prev && prev._id === editingId ? updated : prev));
      } catch (_error) {
        setDrivers((prev) =>
          prev.map((driver) => (driver._id === editingId ? { ...driver, ...formData } : driver))
        );
      }
      resetForm();
      return;
    }

    try {
      const created = await createDriver(formData);
      setDrivers((prev) => [created, ...prev]);
    } catch (_error) {
      const local = { _id: `local-${Date.now()}`, ...formData };
      setDrivers((prev) => [local, ...prev]);
    }
    resetForm();
  };

  const handleEdit = (driver) => {
    setEditingId(driver._id);
    setFormData({
      driverName: driver.driverName || "",
      driverId: driver.driverId || "",
      licenseNumber: driver.licenseNumber || "",
      phone: driver.phone || "",
      assignedBus: driver.assignedBus?._id || driver.assignedBus || "",
      status: driver.status || "Active"
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteDriver(id);
    } catch (_error) {
      // Local fallback below.
    }
    setDrivers((prev) => prev.filter((driver) => driver._id !== id));
    if (selectedDriver && selectedDriver._id === id) {
      setSelectedDriver(null);
    }
    if (editingId === id) {
      resetForm();
    }
  };

  const handleView = (driver) => {
    setSelectedDriver(driver);
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Driver Management</h1>
        <p>Add, edit, delete, and assign drivers to buses.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Drivers</p>
          <h2 className="metric-value">{totalDrivers}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Active Drivers</p>
          <h2 className="metric-value">{activeDrivers}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Assigned to Bus</p>
          <h2 className="metric-value">{assignedDrivers}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Unassigned</p>
          <h2 className="metric-value">{unassignedDrivers}</h2>
        </article>
      </section>

      <section className="manage-buses-grid">
        <article className="panel bus-form-panel">
          <header className="panel-header">
            <h3>{isEditing ? "Edit Driver" : "Add Driver"}</h3>
            <span>{isEditing ? "Update driver details" : "Create a new driver profile"}</span>
          </header>

          <form className="bus-form" onSubmit={handleAddOrUpdate}>
            <label>
              Driver Name
              <input
                type="text"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                placeholder="Driver full name"
              />
            </label>
            <label>
              Driver ID
              <input
                type="text"
                name="driverId"
                value={formData.driverId}
                onChange={handleChange}
                placeholder="DRV-101"
              />
            </label>
            <label>
              License Number
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="DL-2024-12345"
              />
            </label>
            <label>
              Phone
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10 digit number"
              />
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
            <label>
              Status
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Leave">Leave</option>
              </select>
            </label>
            <div className="bus-form-actions">
              <button className="btn-primary" type="submit">
                {isEditing ? "Update Driver" : "Add Driver"}
              </button>
              <button className="btn-secondary" type="button" onClick={resetForm}>
                Clear
              </button>
            </div>
          </form>
        </article>

        <article className="panel bus-table-panel">
          <header className="panel-header">
            <h3>Driver List</h3>
            <span>{drivers.length} records</span>
          </header>

          <div className="table-wrap">
            <table className="bus-table">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Driver ID</th>
                  <th>License Number</th>
                  <th>Phone</th>
                  <th>Assigned Bus</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver._id}>
                    <td>{driver.driverName}</td>
                    <td>{driver.driverId}</td>
                    <td>{driver.licenseNumber}</td>
                    <td>{driver.phone}</td>
                    <td>{driver.assignedBus?.busNumber || "-"}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          driver.status === "Active" ? "status-active" : "status-inactive"
                        }`}
                      >
                        {driver.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button type="button" className="btn-chip" onClick={() => handleView(driver)}>
                        View
                      </button>
                      <button type="button" className="btn-chip" onClick={() => handleEdit(driver)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-chip btn-delete"
                        onClick={() => handleDelete(driver._id)}
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

      {selectedDriver ? (
        <section className="panel bus-details-panel">
          <header className="panel-header">
            <h3>View Driver Details</h3>
            <span>Selected driver information</span>
          </header>
          <div className="bus-details-grid">
            <p>
              <strong>Driver Name:</strong> {selectedDriver.driverName}
            </p>
            <p>
              <strong>Driver ID:</strong> {selectedDriver.driverId}
            </p>
            <p>
              <strong>License Number:</strong> {selectedDriver.licenseNumber}
            </p>
            <p>
              <strong>Phone:</strong> {selectedDriver.phone}
            </p>
            <p>
              <strong>Assigned Bus:</strong> {selectedDriver.assignedBus?.busNumber || "Unassigned"}
            </p>
            <p>
              <strong>Status:</strong> {selectedDriver.status}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default ManageDrivers;
