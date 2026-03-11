import React, { useEffect, useMemo, useState } from "react";
import { getRoutes } from "../../services/routeService";
import { getBuses } from "../../services/busService";
import { createStudent, deleteStudent, getStudents, updateStudent } from "../../services/studentService";

const initialForm = {
  studentName: "",
  registerNumber: "",
  routeName: "",
  busNumber: "",
  boardingPoint: ""
};

function StudentBusAllocation() {
  const [formData, setFormData] = useState(initialForm);
  const [allocations, setAllocations] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);
  const [busOptions, setBusOptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const isEditing = useMemo(() => editingId !== null, [editingId]);
  const totalAllocations = allocations.length;
  const uniqueRoutes = useMemo(
    () => new Set(allocations.map((allocation) => allocation.routeName)).size,
    [allocations]
  );
  const uniqueBoardingPoints = useMemo(
    () =>
      new Set(
        allocations.map((allocation) => (allocation.boardingPoint || "").trim().toLowerCase())
      ).size,
    [allocations]
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [students, routes, buses] = await Promise.all([getStudents(), getRoutes(), getBuses()]);
        setAllocations(students);
        setRouteOptions(routes.map((route) => route.routeName));
        setBusOptions(buses.map((bus) => bus.busNumber));
        setFormData((prev) => ({
          ...prev,
          routeName: prev.routeName || routes[0]?.routeName || "",
          busNumber: prev.busNumber || buses[0]?.busNumber || ""
        }));
      } catch (_error) {
        // Keep local empty state if backend is unavailable.
      }
    };
    loadData();
  }, []);

  const groupedAlignmentView = useMemo(() => {
    const groups = {};
    allocations.forEach((allocation) => {
      const routeName = allocation.routeName || "Unassigned Route";
      const boardingPoint = allocation.boardingPoint || "Unassigned Point";
      const key = `${routeName}||${boardingPoint.toLowerCase()}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          routeName,
          boardingPoint,
          busNumber: allocation.busNumber || "-",
          students: 0
        };
      }
      groups[key].students += 1;
      groups[key].busNumber = allocation.busNumber || groups[key].busNumber;
    });
    return Object.values(groups).sort((a, b) => b.students - a.students);
  }, [allocations]);

  const sortedAllocations = useMemo(() => {
    return [...allocations].sort((a, b) => {
      const routeA = (a.routeName || "").toLowerCase();
      const routeB = (b.routeName || "").toLowerCase();
      const routeCompare = routeA.localeCompare(routeB);
      if (routeCompare !== 0) return sortDirection === "asc" ? routeCompare : -routeCompare;
      return (a.studentName || "").localeCompare(b.studentName || "");
    });
  }, [allocations, sortDirection]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData((prev) => ({
      ...initialForm,
      routeName: routeOptions[0] || "",
      busNumber: busOptions[0] || ""
    }));
    setEditingId(null);
  };

  const handleAssignOrChange = async (event) => {
    event.preventDefault();
    if (!formData.studentName.trim() || !formData.registerNumber.trim()) return;

    const payload = {
      studentName: formData.studentName,
      registerNumber: formData.registerNumber,
      routeName: formData.routeName,
      busNumber: formData.busNumber,
      boardingPoint: formData.boardingPoint
    };

    if (isEditing) {
      try {
        const updated = await updateStudent(editingId, payload);
        setAllocations((prev) => prev.map((row) => (row._id === editingId ? updated : row)));
        setSelectedAllocation((prev) => (prev && prev._id === editingId ? updated : prev));
      } catch (_error) {
        setAllocations((prev) =>
          prev.map((row) => (row._id === editingId ? { ...row, ...payload } : row))
        );
      }
      resetForm();
      return;
    }

    try {
      const created = await createStudent(payload);
      setAllocations((prev) => [created, ...prev]);
    } catch (_error) {
      const local = { _id: `local-${Date.now()}`, ...payload };
      setAllocations((prev) => [local, ...prev]);
    }
    resetForm();
  };

  const handleChangeBus = (allocation) => {
    setEditingId(allocation._id);
    setFormData({
      studentName: allocation.studentName || "",
      registerNumber: allocation.registerNumber || "",
      routeName: allocation.routeName || routeOptions[0] || "",
      busNumber: allocation.busNumber || busOptions[0] || "",
      boardingPoint: allocation.boardingPoint || ""
    });
  };

  const handleRemoveBus = async (id) => {
    try {
      await deleteStudent(id);
    } catch (_error) {
      // Fallback below.
    }
    setAllocations((prev) => prev.filter((row) => row._id !== id));
    if (selectedAllocation && selectedAllocation._id === id) setSelectedAllocation(null);
    if (editingId === id) resetForm();
  };

  const handleSortByRoute = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Student Bus Allocation</h1>
        <p>Assign, change, remove, and sort students by route for bus allocation.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Allocations</p>
          <h2 className="metric-value">{totalAllocations}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Boarding Points</p>
          <h2 className="metric-value">{uniqueBoardingPoints}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Active Routes</p>
          <h2 className="metric-value">{uniqueRoutes}</h2>
        </article>
      </section>

      <section className="manage-buses-grid">
        <article className="panel bus-form-panel">
          <header className="panel-header">
            <h3>{isEditing ? "Change Bus" : "Assign Bus to Student"}</h3>
            <span>{isEditing ? "Update allocation" : "Create a new allocation"}</span>
          </header>
          <form className="bus-form" onSubmit={handleAssignOrChange}>
            <label>
              Student Name
              <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} />
            </label>
            <label>
              Register Number
              <input
                type="text"
                name="registerNumber"
                value={formData.registerNumber}
                onChange={handleChange}
              />
            </label>
            <label>
              Route
              <select name="routeName" value={formData.routeName} onChange={handleChange}>
                {routeOptions.map((routeName) => (
                  <option key={routeName} value={routeName}>
                    {routeName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bus Number
              <select name="busNumber" value={formData.busNumber} onChange={handleChange}>
                {busOptions.map((busNumber) => (
                  <option key={busNumber} value={busNumber}>
                    {busNumber}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Boarding Point
              <input
                type="text"
                name="boardingPoint"
                value={formData.boardingPoint}
                onChange={handleChange}
              />
            </label>
            <div className="bus-form-actions">
              <button className="btn-primary" type="submit">
                {isEditing ? "Change Bus" : "Assign Bus"}
              </button>
              <button className="btn-secondary" type="button" onClick={resetForm}>
                Clear
              </button>
            </div>
          </form>
        </article>

        <article className="panel bus-table-panel">
          <header className="panel-header">
            <h3>Allocation List</h3>
            <span>{allocations.length} records</span>
          </header>
          <div className="bus-form-actions" style={{ padding: "0 16px 12px" }}>
            <button type="button" className="btn-secondary" onClick={handleSortByRoute}>
              Sort by Route ({sortDirection === "asc" ? "A-Z" : "Z-A"})
            </button>
          </div>
          <div className="table-wrap">
            <table className="bus-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Register Number</th>
                  <th>Route</th>
                  <th>Bus Number</th>
                  <th>Boarding Point</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAllocations.map((allocation) => (
                  <tr key={allocation._id}>
                    <td>{allocation.studentName}</td>
                    <td>{allocation.registerNumber}</td>
                    <td>{allocation.routeName}</td>
                    <td>{allocation.busNumber}</td>
                    <td>{allocation.boardingPoint}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="btn-chip"
                        onClick={() => setSelectedAllocation(allocation)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn-chip"
                        onClick={() => handleChangeBus(allocation)}
                      >
                        Change Bus
                      </button>
                      <button
                        type="button"
                        className="btn-chip btn-delete"
                        onClick={() => handleRemoveBus(allocation._id)}
                      >
                        Remove Bus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h3>Alignment Summary</h3>
          <span>Grouped by route and boarding point</span>
        </header>
        <div className="distribution-list">
          {groupedAlignmentView.map((group) => (
            <div key={group.id}>
              <p>
                <strong>{group.routeName}</strong> | {group.boardingPoint}
              </p>
              <p>
                {group.students} students | Bus: <strong>{group.busNumber}</strong>
              </p>
            </div>
          ))}
        </div>
      </section>

      {selectedAllocation ? (
        <section className="panel bus-details-panel">
          <header className="panel-header">
            <h3>Student Allocation Details</h3>
            <span>Selected student allocation</span>
          </header>
          <div className="bus-details-grid">
            <p>
              <strong>Student Name:</strong> {selectedAllocation.studentName}
            </p>
            <p>
              <strong>Register Number:</strong> {selectedAllocation.registerNumber}
            </p>
            <p>
              <strong>Route:</strong> {selectedAllocation.routeName}
            </p>
            <p>
              <strong>Bus Number:</strong> {selectedAllocation.busNumber}
            </p>
            <p>
              <strong>Boarding Point:</strong> {selectedAllocation.boardingPoint}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default StudentBusAllocation;
