import React, { useMemo, useState } from "react";

const initialForm = {
  busNumber: "",
  busName: "",
  route: "",
  driver: "",
  capacity: "",
  status: "Active"
};

const initialBuses = [
  {
    id: 1,
    busNumber: "TN-45-BM-101",
    busName: "Campus Express 1",
    route: "North Gate - Main Block",
    driver: "Arun Kumar",
    capacity: "52",
    status: "Active"
  },
  {
    id: 2,
    busNumber: "TN-45-BM-114",
    busName: "City Link",
    route: "East Stop - Hostel",
    driver: "Meena R",
    capacity: "46",
    status: "Maintenance"
  }
];

function ManageBuses() {
  const [formData, setFormData] = useState(initialForm);
  const [buses, setBuses] = useState(initialBuses);
  const [editingId, setEditingId] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [routeFilter, setRouteFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const isEditing = useMemo(() => editingId !== null, [editingId]);
  const totalBuses = buses.length;
  const activeBuses = useMemo(
    () => buses.filter((bus) => bus.status === "Active").length,
    [buses]
  );
  const maintenanceBuses = useMemo(
    () => buses.filter((bus) => bus.status === "Maintenance").length,
    [buses]
  );
  const totalCapacity = useMemo(
    () => buses.reduce((sum, bus) => sum + Number(bus.capacity || 0), 0),
    [buses]
  );
  const routeOptions = useMemo(() => {
    const uniqueRoutes = Array.from(new Set(buses.map((bus) => bus.route).filter(Boolean)));
    return ["All", ...uniqueRoutes];
  }, [buses]);
  const filteredBuses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return buses.filter((bus) => {
      const matchesSearch =
        !search ||
        bus.busNumber.toLowerCase().includes(search) ||
        bus.busName.toLowerCase().includes(search) ||
        bus.driver.toLowerCase().includes(search) ||
        bus.route.toLowerCase().includes(search);
      const matchesRoute = routeFilter === "All" || bus.route === routeFilter;
      const matchesStatus = statusFilter === "All" || bus.status === statusFilter;

      return matchesSearch && matchesRoute && matchesStatus;
    });
  }, [buses, searchTerm, routeFilter, statusFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleAddOrUpdate = (event) => {
    event.preventDefault();

    if (
      !formData.busNumber.trim() ||
      !formData.busName.trim() ||
      !formData.route.trim() ||
      !formData.driver.trim() ||
      !formData.capacity.toString().trim()
    ) {
      return;
    }

    if (isEditing) {
      setBuses((prev) =>
        prev.map((bus) =>
          bus.id === editingId ? { ...bus, ...formData, capacity: String(formData.capacity) } : bus
        )
      );
      setSelectedBus((prev) =>
        prev && prev.id === editingId
          ? { ...prev, ...formData, capacity: String(formData.capacity) }
          : prev
      );
      resetForm();
      return;
    }

    const newBus = {
      id: Date.now(),
      ...formData,
      capacity: String(formData.capacity)
    };
    setBuses((prev) => [newBus, ...prev]);
    resetForm();
  };

  const handleEdit = (bus) => {
    setEditingId(bus.id);
    setFormData({
      busNumber: bus.busNumber,
      busName: bus.busName,
      route: bus.route,
      driver: bus.driver,
      capacity: bus.capacity,
      status: bus.status
    });
  };

  const handleDelete = (id) => {
    setBuses((prev) => prev.filter((bus) => bus.id !== id));
    if (selectedBus && selectedBus.id === id) {
      setSelectedBus(null);
    }
    if (editingId === id) {
      resetForm();
    }
  };

  const handleView = (bus) => {
    setSelectedBus(bus);
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Bus Management</h1>
        <p>Admin can add, edit, delete, and view bus details.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Buses</p>
          <h2 className="metric-value">{totalBuses}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Active Buses</p>
          <h2 className="metric-value">{activeBuses}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Maintenance Buses</p>
          <h2 className="metric-value">{maintenanceBuses}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Total Capacity</p>
          <h2 className="metric-value">{totalCapacity}</h2>
        </article>
      </section>

      <section className="manage-buses-grid">
        <article className="panel bus-form-panel">
          <header className="panel-header">
            <h3>{isEditing ? "Edit Bus" : "Add Bus"}</h3>
            <span>{isEditing ? "Update existing bus record" : "Create a new bus record"}</span>
          </header>

          <form className="bus-form" onSubmit={handleAddOrUpdate}>
            <label>
              Bus Number
              <input
                type="text"
                name="busNumber"
                value={formData.busNumber}
                onChange={handleChange}
                placeholder="TN-45-BM-000"
              />
            </label>

            <label>
              Bus Name
              <input
                type="text"
                name="busName"
                value={formData.busName}
                onChange={handleChange}
                placeholder="Campus Express"
              />
            </label>

            <label>
              Route
              <input
                type="text"
                name="route"
                value={formData.route}
                onChange={handleChange}
                placeholder="Main Gate - Hostel"
              />
            </label>

            <label>
              Driver
              <input
                type="text"
                name="driver"
                value={formData.driver}
                onChange={handleChange}
                placeholder="Driver name"
              />
            </label>

            <label>
              Capacity
              <input
                type="number"
                min="1"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="50"
              />
            </label>

            <label>
              Status
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </label>

            <div className="bus-form-actions">
              <button className="btn-primary" type="submit">
                {isEditing ? "Update Bus" : "Add Bus"}
              </button>
              <button className="btn-secondary" type="button" onClick={resetForm}>
                Clear
              </button>
            </div>
          </form>
        </article>

        <article className="panel bus-table-panel">
          <header className="panel-header">
            <h3>Bus List</h3>
            <span>{filteredBuses.length} records</span>
          </header>

          <div className="manage-buses-controls">
            <input
              type="text"
              className="bus-list-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by bus number, driver, or route"
            />
            <select
              className="manage-buses-filter-select"
              value={routeFilter}
              onChange={(event) => setRouteFilter(event.target.value)}
            >
              {routeOptions.map((route) => (
                <option key={route} value={route}>
                  {route === "All" ? "All Routes" : route}
                </option>
              ))}
            </select>
            <select
              className="manage-buses-filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="table-wrap">
            <table className="bus-table">
              <thead>
                <tr>
                  <th>Bus Number</th>
                  <th>Bus Name</th>
                  <th>Route</th>
                  <th>Driver</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuses.length ? (
                  filteredBuses.map((bus) => (
                    <tr key={bus.id}>
                      <td>{bus.busNumber}</td>
                      <td>{bus.busName}</td>
                      <td>{bus.route}</td>
                      <td>{bus.driver}</td>
                      <td>{bus.capacity}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            bus.status === "Active" ? "status-active" : "status-maintenance"
                          }`}
                        >
                          {bus.status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button type="button" className="btn-chip" onClick={() => handleView(bus)}>
                          View
                        </button>
                        <button type="button" className="btn-chip" onClick={() => handleEdit(bus)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-chip btn-delete"
                          onClick={() => handleDelete(bus.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No buses found for current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {selectedBus ? (
        <section className="panel bus-details-panel">
          <header className="panel-header">
            <h3>View Bus Details</h3>
            <span>Selected bus information</span>
          </header>
          <div className="bus-details-grid">
            <p>
              <strong>Bus Number:</strong> {selectedBus.busNumber}
            </p>
            <p>
              <strong>Bus Name:</strong> {selectedBus.busName}
            </p>
            <p>
              <strong>Route:</strong> {selectedBus.route}
            </p>
            <p>
              <strong>Driver:</strong> {selectedBus.driver}
            </p>
            <p>
              <strong>Capacity:</strong> {selectedBus.capacity}
            </p>
            <p>
              <strong>Status:</strong> {selectedBus.status}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default ManageBuses;
