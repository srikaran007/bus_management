import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createDriver,
  deleteDriver,
  getDriversPage,
  updateDriver
} from "../../services/driverService";
import { getBusesPage } from "../../services/busService";
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

const mapDriver = (driver) => ({
  id: driver._id || driver.id,
  driverName: driver.driverName || "",
  driverId: driver.driverId || "",
  licenseNumber: driver.licenseNumber || "",
  phone: driver.phone || "",
  assignedBus: driver.assignedBus || null,
  status: driver.status || "Active",
  institution: driver.institution || ""
});

const getInstitutionActionParams = (entity, isAdmin) => {
  if (!isAdmin || !entity?.institution) return {};
  return { institution: entity.institution };
};

function ManageDrivers() {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isAdmin = currentUser?.role === "admin";
  const defaultInstitution = currentUser?.institution || institutions[0];

  const initialForm = useMemo(
    () => ({
      driverName: "",
      driverId: "",
      licenseNumber: "",
      phone: "",
      assignedBus: "",
      status: "Active",
      institution: defaultInstitution
    }),
    [defaultInstitution]
  );

  const [formData, setFormData] = useState(initialForm);
  const [drivers, setDrivers] = useState([]);
  const [busOptions, setBusOptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [institutionFilter, setInstitutionFilter] = useState(isAdmin ? "All" : defaultInstitution);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, active: 0, assigned: 0, unassigned: 0 });

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const fetchDrivers = useCallback(async () => {
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

      const response = await getDriversPage(params);
      setDrivers((response.items || []).map(mapDriver));
      setPagination(response.pagination || { total: 0, page: 1, limit: pageSize, totalPages: 1 });
      setSummary(
        response.summary || {
          total: response.pagination?.total || 0,
          active: 0,
          assigned: 0,
          unassigned: 0
        }
      );
    } catch (_error) {
      setErrorMessage("Unable to load drivers from server.");
      setDrivers([]);
      setPagination({ total: 0, page: 1, limit: pageSize, totalPages: 1 });
      setSummary({ total: 0, active: 0, assigned: 0, unassigned: 0 });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, institutionFilter, isAdmin]);

  const fetchBusOptions = useCallback(async () => {
    try {
      const params = { page: 1, limit: 500 };
      if (isAdmin) {
        params.institution = formData.institution;
      }
      const busRows = await getBusesPage(params);
      setBusOptions(
        (busRows.items || []).map((bus) => ({
          id: bus._id || bus.id,
          institution: bus.institution,
          label: `${bus.busNumber} - ${bus.busName || "Bus"}`
        }))
      );
    } catch (_error) {
      setBusOptions([]);
    }
  }, [formData.institution, isAdmin]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    fetchBusOptions();
  }, [fetchBusOptions]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      institution: prev.institution || defaultInstitution
    }));
  }, [defaultInstitution]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      if (name === "institution") {
        return { ...prev, institution: value, assignedBus: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const resetForm = () => {
    setFormData({
      ...initialForm,
      institution: isAdmin && institutionFilter !== "All" ? institutionFilter : initialForm.institution
    });
    setEditingId(null);
  };

  const handleAddOrUpdate = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.driverName.trim() || !formData.driverId.trim() || !formData.licenseNumber.trim()) {
      return;
    }

    const payload = {
      driverName: formData.driverName.trim(),
      driverId: formData.driverId.trim(),
      licenseNumber: formData.licenseNumber.trim(),
      phone: formData.phone.trim(),
      assignedBus: formData.assignedBus ? Number(formData.assignedBus) : null,
      status: formData.status,
      institution: formData.institution
    };

    if (isAdmin && !payload.institution) {
      setErrorMessage("Please select an institution.");
      return;
    }

    if (isEditing) {
      try {
        const params = getInstitutionActionParams(formData, isAdmin);
        await updateDriver(editingId, payload, params);
      } catch (_error) {
        setErrorMessage("Unable to update driver.");
        return;
      }

      resetForm();
      fetchDrivers();
      return;
    }

    try {
      const params = isAdmin ? { institution: formData.institution } : {};
      await createDriver(payload, params);
    } catch (_error) {
      setErrorMessage("Unable to create driver.");
      return;
    }

    resetForm();
    setCurrentPage(1);
  };

  const handleEdit = (driver) => {
    setEditingId(driver.id);
    setFormData({
      driverName: driver.driverName || "",
      driverId: driver.driverId || "",
      licenseNumber: driver.licenseNumber || "",
      phone: driver.phone || "",
      assignedBus: driver.assignedBus?._id || driver.assignedBus?.id || driver.assignedBus || "",
      status: driver.status || "Active",
      institution: driver.institution || defaultInstitution
    });
  };

  const handleDelete = async (driver) => {
    setErrorMessage("");

    try {
      await deleteDriver(driver.id, getInstitutionActionParams(driver, isAdmin));
    } catch (_error) {
      setErrorMessage("Unable to delete driver.");
      return;
    }

    if (selectedDriver && String(selectedDriver.id) === String(driver.id)) {
      setSelectedDriver(null);
    }
    if (String(editingId) === String(driver.id)) {
      resetForm();
    }

    const isOnlyRowOnPage = drivers.length === 1 && currentPage > 1;
    if (isOnlyRowOnPage) {
      setCurrentPage((prev) => prev - 1);
    } else {
      fetchDrivers();
    }
  };

  const handleView = (driver) => {
    setSelectedDriver(driver);
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
        <h1>Driver Management</h1>
        <p>Add, edit, delete, and assign drivers to buses.</p>
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Drivers</p>
          <h2 className="metric-value">{summary.total}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Active Drivers</p>
          <h2 className="metric-value">{summary.active}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Assigned to Bus</p>
          <h2 className="metric-value">{summary.assigned}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Unassigned</p>
          <h2 className="metric-value">{summary.unassigned}</h2>
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
              <button className="btn-primary" type="submit" disabled={loading}>
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
            <span>{pagination.total || 0} records</span>
          </header>

          <div className="manage-buses-controls">
            <input
              type="text"
              className="bus-list-search"
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search by driver name, id, phone, or license"
            />
            <select
              className="manage-buses-filter-select"
              value={statusFilter}
              onChange={onStatusFilterChange}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Leave">Leave</option>
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
                  <th>Driver Name</th>
                  <th>Driver ID</th>
                  <th>Institution</th>
                  <th>License Number</th>
                  <th>Phone</th>
                  <th>Assigned Bus</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length ? (
                  drivers.map((driver) => (
                    <tr key={`${driver.institution}-${driver.id}`}>
                      <td>{driver.driverName}</td>
                      <td>{driver.driverId}</td>
                      <td>{driver.institution || "-"}</td>
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
                          onClick={() => handleDelete(driver)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">{loading ? "Loading drivers..." : "No drivers found for current filters."}</td>
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
              <strong>Institution:</strong> {selectedDriver.institution || "-"}
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
