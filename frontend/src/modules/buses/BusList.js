import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteBusRecord, getBuses } from "./busStore";

function BusList() {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    const loadBuses = async () => {
      const data = await getBuses();
      setBuses(data);
    };
    loadBuses();
  }, []);

  const filteredBuses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return buses;
    }

    return buses.filter((bus) => {
      return (
        bus.busNumber.toLowerCase().includes(normalizedSearch) ||
        bus.busName.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [buses, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredBuses.length / rowsPerPage));
  const paginatedBuses = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredBuses.slice(start, start + rowsPerPage);
  }, [filteredBuses, currentPage]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this bus?");
    if (!confirmed) {
      return;
    }

    const updated = await deleteBusRecord(id);
    setBuses(updated);
  };

  const handleEdit = (bus) => {
    navigate("/buses/edit", { state: { busId: bus.id } });
  };

  const handleAddBus = () => {
    navigate("/admin/add-bus");
  };

  const goToPrevious = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNext = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  return (
    <div className="admin-overview manage-buses-page">
      <section className="panel">
        <header className="panel-header bus-list-header">
          <div>
            <h2>Bus Management</h2>
            <span>Display and manage all buses in the system</span>
          </div>
          <button type="button" className="btn-primary" onClick={handleAddBus}>
            + Add Bus
          </button>
        </header>

        <div className="bus-list-search-wrap">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by Bus Number or Bus Name"
            className="bus-list-search"
          />
        </div>

        <div className="table-wrap">
          <table className="bus-table">
            <thead>
              <tr>
                <th>Bus No</th>
                <th>Bus Name</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBuses.length ? (
                paginatedBuses.map((bus) => (
                  <tr key={bus.id}>
                    <td>{bus.busNumber}</td>
                    <td>{bus.busName}</td>
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
                  <td colSpan="5">No buses found for the current search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bus-list-pagination">
          <button type="button" className="btn-secondary" onClick={goToPrevious} disabled={currentPage === 1}>
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            onClick={goToNext}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}

export default BusList;
