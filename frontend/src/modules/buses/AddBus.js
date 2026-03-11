import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addBusRecord } from "./busStore";

const routeOptions = ["North Loop", "City Connector", "South Shuttle", "Hostel Circular"];

const initialForm = {
  busNumber: "",
  busName: "",
  busCapacity: "",
  driverName: "",
  driverPhone: "",
  routeName: routeOptions[0],
  startingPoint: "",
  endingPoint: "",
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

    if (!/^\d{10}$/.test(formData.driverPhone.trim())) {
      validationErrors.driverPhone = "Driver phone must be exactly 10 digits.";
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
      route: formData.routeName.trim(),
      driver: formData.driverName.trim(),
      phone: formData.driverPhone.trim(),
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
              Driver Phone
              <input
                type="text"
                name="driverPhone"
                value={formData.driverPhone}
                onChange={handleChange}
                placeholder="10 digit number"
              />
              {errors.driverPhone ? (
                <small className="form-error">{errors.driverPhone}</small>
              ) : null}
            </label>

            <label>
              Route Name
              <select name="routeName" value={formData.routeName} onChange={handleChange}>
                {routeOptions.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Starting Point
              <input
                type="text"
                name="startingPoint"
                value={formData.startingPoint}
                onChange={handleChange}
                placeholder="North Gate"
              />
            </label>

            <label>
              Ending Point
              <input
                type="text"
                name="endingPoint"
                value={formData.endingPoint}
                onChange={handleChange}
                placeholder="Main Block"
              />
            </label>

            <label>
              Bus Status
              <select name="busStatus" value={formData.busStatus} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
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
