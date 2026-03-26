import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addBusRecord } from "./busStore";

const initialForm = {
  busNumber: "",
  busName: "",
  busCapacity: "",
  busStatus: "Active"
};

function AddBus() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const validationErrors = {};

    if (!formData.busNumber.trim()) {
      validationErrors.busNumber = "Bus Number is required.";
    }

    if (!formData.busName.trim()) {
      validationErrors.busName = "Bus Name is required.";
    }

    if (
      formData.busCapacity === "" ||
      Number.isNaN(Number(formData.busCapacity)) ||
      Number(formData.busCapacity) <= 0
    ) {
      validationErrors.busCapacity = "Capacity must be a valid number.";
    }

    return validationErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setSuccessMessage("");
      return;
    }

    setErrors({});
    setSuccessMessage("Bus Added Successfully");
    await addBusRecord({
      busNumber: formData.busNumber.trim(),
      busName: formData.busName.trim(),
      capacity: Number(formData.busCapacity),
      status: formData.busStatus
    });
    window.alert("Bus Added Successfully");
    setFormData(initialForm);
    navigate("/buses/list");
  };

  const handleCancel = () => {
    navigate("/buses/list");
  };

  return (
    <div className="add-bus-page">
      <section className="overview-hero">
        <h1>Add New Bus</h1>
        <p>Register a new bus for Admin / Transport Incharge operations.</p>
      </section>

      <section className="panel add-bus-card">
        <header className="panel-header">
          <h3>Bus Details Form</h3>
          <span>Enter bus and route information</span>
        </header>

        <form className="bus-form" onSubmit={handleSubmit}>
          <div className="add-bus-form-grid">
            <label>
              Bus Number
              <input
                type="text"
                name="busNumber"
                value={formData.busNumber}
                onChange={handleChange}
                placeholder="TN-45-BM-000"
              />
              {errors.busNumber ? <small className="form-error">{errors.busNumber}</small> : null}
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
              {errors.busName ? <small className="form-error">{errors.busName}</small> : null}
            </label>

            <label>
              Bus Capacity
              <input
                type="number"
                min="1"
                name="busCapacity"
                value={formData.busCapacity}
                onChange={handleChange}
                placeholder="50"
              />
              {errors.busCapacity ? (
                <small className="form-error">{errors.busCapacity}</small>
              ) : null}
            </label>

            <label>
              Bus Status
              <select name="busStatus" value={formData.busStatus} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Idle">Idle</option>
              </select>
            </label>
          </div>

          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          <div className="bus-form-actions">
            <button type="submit" className="btn-primary">
              Add Bus
            </button>
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AddBus;
