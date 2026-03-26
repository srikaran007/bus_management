import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createRoute,
  deleteRoute,
  getRoutesPage,
  updateRoute
} from "../../services/routeService";
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

const mapRoute = (route) => ({
  id: route._id || route.id,
  routeId: route.routeId || "",
  routeName: route.routeName || "",
  startingPoint: route.startingPoint || "",
  endingPoint: route.endingPoint || "",
  stops: Array.isArray(route.stops) ? route.stops : [],
  assignedBus: route.assignedBus || null,
  institution: route.institution || ""
});

const getInstitutionActionParams = (entity, isAdmin) => {
  if (!isAdmin || !entity?.institution) return {};
  return { institution: entity.institution };
};

function ManageRoutes() {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isAdmin = currentUser?.role === "admin";
  const defaultInstitution = currentUser?.institution || institutions[0];

  const initialForm = useMemo(
    () => ({
      routeId: "",
      routeName: "",
      startingPoint: "",
      endingPoint: "",
      stops: "",
      assignedBus: "",
      institution: defaultInstitution
    }),
    [defaultInstitution]
  );

  const [formData, setFormData] = useState(initialForm);
  const [routes, setRoutes] = useState([]);
  const [busOptions, setBusOptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [institutionFilter, setInstitutionFilter] = useState(isAdmin ? "All" : defaultInstitution);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, assigned: 0, unassigned: 0 });

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm.trim() || undefined,
        assignment: assignmentFilter === "all" ? undefined : assignmentFilter
      };

      if (isAdmin && institutionFilter !== "All") {
        params.institution = institutionFilter;
      }

      const response = await getRoutesPage(params);
      setRoutes((response.items || []).map(mapRoute));
      setPagination(response.pagination || { total: 0, page: 1, limit: pageSize, totalPages: 1 });
      setSummary(
        response.summary || {
          total: response.pagination?.total || 0,
          assigned: 0,
          unassigned: 0
        }
      );
    } catch (_error) {
      setErrorMessage("Unable to load routes from server.");
      setRoutes([]);
      setPagination({ total: 0, page: 1, limit: pageSize, totalPages: 1 });
      setSummary({ total: 0, assigned: 0, unassigned: 0 });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, assignmentFilter, institutionFilter, isAdmin]);

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
    fetchRoutes();
  }, [fetchRoutes]);

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

    if (!formData.routeId.trim() || !formData.routeName.trim()) return;

    const payload = {
      routeId: formData.routeId.trim(),
      routeName: formData.routeName.trim(),
      startingPoint: formData.startingPoint.trim(),
      endingPoint: formData.endingPoint.trim(),
      stops: formData.stops
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      assignedBus: formData.assignedBus ? Number(formData.assignedBus) : null,
      institution: formData.institution
    };

    if (isAdmin && !payload.institution) {
      setErrorMessage("Please select an institution.");
      return;
    }

    if (isEditing) {
      try {
        await updateRoute(editingId, payload, getInstitutionActionParams(formData, isAdmin));
      } catch (_error) {
        setErrorMessage("Unable to update route.");
        return;
      }

      resetForm();
      fetchRoutes();
      return;
    }

    try {
      const params = isAdmin ? { institution: formData.institution } : {};
      await createRoute(payload, params);
    } catch (_error) {
      setErrorMessage("Unable to create route.");
      return;
    }

    resetForm();
    setCurrentPage(1);
  };

  const handleEdit = (route) => {
    setEditingId(route.id);
    setFormData({
      routeId: route.routeId || "",
      routeName: route.routeName || "",
      startingPoint: route.startingPoint || "",
      endingPoint: route.endingPoint || "",
      stops: Array.isArray(route.stops) ? route.stops.join(", ") : route.stops || "",
      assignedBus: route.assignedBus?._id || route.assignedBus?.id || route.assignedBus || "",
      institution: route.institution || defaultInstitution
    });
  };

  const handleDelete = async (route) => {
    setErrorMessage("");

    try {
      await deleteRoute(route.id, getInstitutionActionParams(route, isAdmin));
    } catch (_error) {
      setErrorMessage("Unable to delete route.");
      return;
    }

    if (selectedRoute && String(selectedRoute.id) === String(route.id)) setSelectedRoute(null);
    if (String(editingId) === String(route.id)) resetForm();

    const isOnlyRowOnPage = routes.length === 1 && currentPage > 1;
    if (isOnlyRowOnPage) {
      setCurrentPage((prev) => prev - 1);
    } else {
      fetchRoutes();
    }
  };

  const handleView = (route) => {
    setSelectedRoute(route);
  };

  const onSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const onAssignmentChange = (event) => {
    setAssignmentFilter(event.target.value);
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
        <h1>Route Management</h1>
        <p>Create, update, and remove bus routes.</p>
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Routes</p>
          <h2 className="metric-value">{summary.total}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Assigned Bus</p>
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
              <button className="btn-primary" type="submit" disabled={loading}>
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
            <span>{pagination.total || 0} records</span>
          </header>

          <div className="manage-buses-controls">
            <input
              type="text"
              className="bus-list-search"
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search by route ID/name/start/end"
            />
            <select className="manage-buses-filter-select" value={assignmentFilter} onChange={onAssignmentChange}>
              <option value="all">All Routes</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
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
                  <th>Route ID</th>
                  <th>Route Name</th>
                  <th>Institution</th>
                  <th>Starting Point</th>
                  <th>Ending Point</th>
                  <th>Stops</th>
                  <th>Assigned Bus</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.length ? (
                  routes.map((route) => (
                    <tr key={`${route.institution}-${route.id}`}>
                      <td>{route.routeId}</td>
                      <td>{route.routeName}</td>
                      <td>{route.institution || "-"}</td>
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
                          onClick={() => handleDelete(route)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">{loading ? "Loading routes..." : "No routes found for current filters."}</td>
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
              <strong>Institution:</strong> {selectedRoute.institution || "-"}
            </p>
            <p>
              <strong>Starting Point:</strong> {selectedRoute.startingPoint}
            </p>
            <p>
              <strong>Ending Point:</strong> {selectedRoute.endingPoint}
            </p>
            <p>
              <strong>Stops:</strong> {Array.isArray(selectedRoute.stops) ? selectedRoute.stops.join(", ") : selectedRoute.stops}
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
