import React, { useCallback, useEffect, useMemo, useState } from "react";
import { addBus, deleteBus, getBusesPage, updateBus } from "../../services/busService";
import { getCurrentUser } from "../../services/sessionService";

const institutions = [
  "N.S Eng Clg",
  "N.S Arts Clg",
  "N.S Matric School",
  "N.S Public School",
  "Vidyalaya School",
  "BEd Clg"
];

const pageSizeOptions = [10, 20, 50];

const mapBus = (bus) => ({
  id: bus._id || bus.id,
  busNumber: bus.busNumber || "",
  busName: bus.busName || "",
  capacity: String(bus.capacity || ""),
  status: bus.status || "Active",
  institution: bus.institution || ""
});

const getInstitutionActionParams = (bus, isAdmin) => {
  if (!isAdmin || !bus?.institution) return {};
  return { institution: bus.institution };
};

function ManageBuses() {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isAdmin = currentUser?.role === "admin";
  const defaultInstitution = currentUser?.institution || institutions[0];

  const initialForm = useMemo(
    () => ({
      busNumber: "",
      busName: "",
      capacity: "",
      status: "Active",
      institution: defaultInstitution
    }),
    [defaultInstitution]
  );

  const [formData, setFormData] = useState(initialForm);
  const [buses, setBuses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [institutionFilter, setInstitutionFilter] = useState(isAdmin ? "All" : defaultInstitution);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, active: 0, maintenance: 0, capacityTotal: 0 });

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const totalBuses = summary.total;
  const activeBuses = summary.active;
  const maintenanceBuses = summary.maintenance;
  const totalCapacity = summary.capacityTotal;

  const fetchBuses = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm.trim() || undefined,
        status: statusFilter === "All" ? undefined : statusFilter
      };

      if (isAdmin && institutionFilter !== "All") {
        params.institution = institutionFilter;
      }

      const response = await getBusesPage(params);
      setBuses((response.items || []).map(mapBus));
      setPagination(response.pagination || { total: 0, page: 1, limit: pageSize, totalPages: 1 });
      setSummary(
        response.summary || {
          total: response.pagination?.total || 0,
          active: 0,
          maintenance: 0,
          capacityTotal: 0
        }
      );
    } catch (_error) {
      setErrorMessage("Unable to load buses from server.");
      setBuses([]);
      setPagination({ total: 0, page: 1, limit: pageSize, totalPages: 1 });
      setSummary({ total: 0, active: 0, maintenance: 0, capacityTotal: 0 });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, institutionFilter, isAdmin]);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      institution: prev.institution || defaultInstitution
    }));
  }, [defaultInstitution]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      ...initialForm,
      institution:
        isAdmin && institutionFilter !== "All" ? institutionFilter : initialForm.institution
    });
    setEditingId(null);
  };

  const handleAddOrUpdate = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (
      !formData.busNumber.trim() ||
      !formData.busName.trim() ||
      !formData.capacity.toString().trim()
    ) {
      return;
    }

    if (isAdmin && !formData.institution) {
      setErrorMessage("Please select an institution.");
      return;
    }

    if (isEditing) {
      try {
        const params = getInstitutionActionParams(formData, isAdmin);
        const updated = await updateBus(
          editingId,
          {
            busNumber: formData.busNumber.trim(),
            busName: formData.busName.trim(),
            capacity: Number(formData.capacity),
            status: formData.status
          },
          params
        );
        const mapped = mapBus({ ...updated, institution: formData.institution || updated.institution });

        setBuses((prev) => prev.map((bus) => (String(bus.id) === String(editingId) ? mapped : bus)));
        setSelectedBus((prev) =>
          prev && String(prev.id) === String(editingId) ? mapped : prev
        );
      } catch (_error) {
        setErrorMessage("Unable to update bus.");
        return;
      }

      resetForm();
      fetchBuses();
      return;
    }

    try {
      const params = isAdmin ? { institution: formData.institution } : {};
      await addBus(
        {
          busNumber: formData.busNumber.trim(),
          busName: formData.busName.trim(),
          capacity: Number(formData.capacity),
          status: formData.status,
          institution: formData.institution
        },
        params
      );
    } catch (_error) {
      setErrorMessage("Unable to create bus.");
      return;
    }

    resetForm();
    setCurrentPage(1);
  };

  const handleEdit = (bus) => {
    setEditingId(bus.id);
    setFormData({
      busNumber: bus.busNumber,
      busName: bus.busName,
      capacity: bus.capacity,
      status: bus.status,
      institution: bus.institution || defaultInstitution
    });
  };

  const handleDelete = (bus) => {
    const removeRow = async () => {
      setErrorMessage("");
      try {
        await deleteBus(bus.id, getInstitutionActionParams(bus, isAdmin));
      } catch (_error) {
        setErrorMessage("Unable to delete bus.");
        return;
      }

      if (selectedBus && String(selectedBus.id) === String(bus.id)) {
        setSelectedBus(null);
      }
      if (String(editingId) === String(bus.id)) {
        resetForm();
      }

      const isOnlyRowOnPage = buses.length === 1 && currentPage > 1;
      if (isOnlyRowOnPage) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchBuses();
      }
    };

    removeRow();
  };

  const handleView = (bus) => {
    setSelectedBus(bus);
  };

  const onSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const onStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  };

  const onInstitutionFilterChange = (event) => {
    setInstitutionFilter(event.target.value);
    setCurrentPage(1);
  };

  const onPageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Number(pagination.totalPages || 1));

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Bus Management</h1>
        <p>Admin can add, edit, delete, and view bus details.</p>
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

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
                placeholder="TN60-0001"
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

            {isAdmin ? (
              <label>
                Institution
                <select name="institution" value={formData.institution} onChange={handleChange} required>
                  {institutions.map((institution) => (
                    <option key={institution} value={institution}>
                      {institution}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

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
                <option value="Idle">Idle</option>
              </select>
            </label>

            <div className="bus-form-actions">
              <button className="btn-primary" type="submit" disabled={loading}>
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
            <span>{pagination.total || 0} records</span>
          </header>

          <div className="manage-buses-controls">
            <input
              type="text"
              className="bus-list-search"
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search by bus number or name"
            />
            <select
              className="manage-buses-filter-select"
              value={statusFilter}
              onChange={onStatusFilterChange}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Idle">Idle</option>
            </select>
            {isAdmin ? (
              <select
                className="manage-buses-filter-select"
                value={institutionFilter}
                onChange={onInstitutionFilterChange}
              >
                <option value="All">All Institutions</option>
                {institutions.map((institution) => (
                  <option key={institution} value={institution}>
                    {institution}
                  </option>
                ))}
              </select>
            ) : (
              <select className="manage-buses-filter-select" value={pageSize} onChange={onPageSizeChange}>
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            )}
          </div>

          {isAdmin ? (
            <div className="manage-buses-controls" style={{ paddingTop: 0 }}>
              <span />
              <span />
              <select className="manage-buses-filter-select" value={pageSize} onChange={onPageSizeChange}>
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="table-wrap">
            <table className="bus-table">
              <thead>
                <tr>
                  <th>Bus Number</th>
                  <th>Bus Name</th>
                  <th>Institution</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buses.length ? (
                  buses.map((bus) => (
                    <tr key={`${bus.institution}-${bus.id}`}>
                      <td>{bus.busNumber}</td>
                      <td>{bus.busName}</td>
                      <td>{bus.institution || "-"}</td>
                      <td>{bus.capacity}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            bus.status === "Active"
                              ? "status-active"
                              : bus.status === "Maintenance"
                                ? "status-maintenance"
                                : "status-inactive"
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
                          onClick={() => handleDelete(bus)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">{loading ? "Loading buses..." : "No buses found for current filters."}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bus-list-pagination">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || loading}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages || loading}
            >
              Next
            </button>
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
              <strong>Institution:</strong> {selectedBus.institution || "-"}
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
