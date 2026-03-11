import React, { useMemo, useState } from "react";

const roleOptions = ["Admin", "Transport Incharge", "Staff", "Student"];

const initialForm = {
  staffName: "",
  employeeId: "",
  phone: "",
  email: "",
  role: "Staff"
};

const initialMembers = [
  {
    id: 1,
    staffName: "Karthik Raj",
    employeeId: "EMP-1001",
    phone: "9876501234",
    email: "karthik@campus.edu",
    role: "Transport Incharge"
  },
  {
    id: 2,
    staffName: "Priya N",
    employeeId: "EMP-1002",
    phone: "9876505678",
    email: "priya@campus.edu",
    role: "Staff"
  }
];

function StaffTransportInchargeManagement() {
  const [formData, setFormData] = useState(initialForm);
  const [members, setMembers] = useState(initialMembers);
  const [editingId, setEditingId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);
  const totalMembers = members.length;
  const transportInchargeCount = useMemo(
    () => members.filter((member) => member.role === "Transport Incharge").length,
    [members]
  );
  const adminCount = useMemo(
    () => members.filter((member) => member.role === "Admin").length,
    [members]
  );

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
      !formData.staffName.trim() ||
      !formData.employeeId.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim() ||
      !formData.role.trim()
    ) {
      return;
    }

    if (isEditing) {
      setMembers((prev) =>
        prev.map((member) => (member.id === editingId ? { ...member, ...formData } : member))
      );
      setSelectedMember((prev) => (prev && prev.id === editingId ? { ...prev, ...formData } : prev));
      resetForm();
      return;
    }

    const newMember = {
      id: Date.now(),
      ...formData
    };

    setMembers((prev) => [newMember, ...prev]);
    resetForm();
  };

  const handleEdit = (member) => {
    setEditingId(member.id);
    setFormData({
      staffName: member.staffName,
      employeeId: member.employeeId,
      phone: member.phone,
      email: member.email,
      role: member.role
    });
  };

  const handleDelete = (id) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
    if (selectedMember && selectedMember.id === id) {
      setSelectedMember(null);
    }
    if (editingId === id) {
      resetForm();
    }
  };

  const handleView = (member) => {
    setSelectedMember(member);
  };

  return (
    <div className="admin-overview manage-buses-page">
      <section className="overview-hero">
        <h1>Staff / Transport Incharge Management</h1>
        <p>Add staff and assign roles for operations control.</p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card metric-accent-red">
          <p className="metric-title">Total Members</p>
          <h2 className="metric-value">{totalMembers}</h2>
        </article>
        <article className="metric-card metric-accent-light">
          <p className="metric-title">Admins</p>
          <h2 className="metric-value">{adminCount}</h2>
        </article>
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Transport Incharge</p>
          <h2 className="metric-value">{transportInchargeCount}</h2>
        </article>
      </section>

      <section className="manage-buses-grid">
        <article className="panel bus-form-panel">
          <header className="panel-header">
            <h3>{isEditing ? "Edit Staff" : "Add Staff"}</h3>
            <span>{isEditing ? "Update member details and role" : "Create a new staff member"}</span>
          </header>

          <form className="bus-form" onSubmit={handleAddOrUpdate}>
            <label>
              Staff Name
              <input
                type="text"
                name="staffName"
                value={formData.staffName}
                onChange={handleChange}
                placeholder="Full name"
              />
            </label>

            <label>
              Employee ID
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="EMP-1003"
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
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@campus.edu"
              />
            </label>

            <label>
              Assign Role
              <select name="role" value={formData.role} onChange={handleChange}>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <div className="bus-form-actions">
              <button className="btn-primary" type="submit">
                {isEditing ? "Update Role" : "Add Staff"}
              </button>
              <button className="btn-secondary" type="button" onClick={resetForm}>
                Clear
              </button>
            </div>
          </form>
        </article>

        <article className="panel bus-table-panel">
          <header className="panel-header">
            <h3>Staff List</h3>
            <span>{members.length} records</span>
          </header>

          <div className="table-wrap">
            <table className="bus-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Employee ID</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.staffName}</td>
                    <td>{member.employeeId}</td>
                    <td>{member.phone}</td>
                    <td>{member.email}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          member.role === "Transport Incharge" || member.role === "Admin"
                            ? "status-active"
                            : "status-maintenance"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button type="button" className="btn-chip" onClick={() => handleView(member)}>
                        View
                      </button>
                      <button type="button" className="btn-chip" onClick={() => handleEdit(member)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-chip btn-delete"
                        onClick={() => handleDelete(member.id)}
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

      {selectedMember ? (
        <section className="panel bus-details-panel">
          <header className="panel-header">
            <h3>Staff Details</h3>
            <span>Selected member information</span>
          </header>
          <div className="bus-details-grid">
            <p>
              <strong>Staff Name:</strong> {selectedMember.staffName}
            </p>
            <p>
              <strong>Employee ID:</strong> {selectedMember.employeeId}
            </p>
            <p>
              <strong>Phone:</strong> {selectedMember.phone}
            </p>
            <p>
              <strong>Email:</strong> {selectedMember.email}
            </p>
            <p>
              <strong>Role:</strong> {selectedMember.role}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default StaffTransportInchargeManagement;
