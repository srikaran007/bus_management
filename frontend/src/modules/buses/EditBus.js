import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getBuses, updateBusRecord } from "./busStore";

const routeOptions = ["Main Campus", "City Connector", "North Loop", "South Shuttle", "Hostel Circular"];

const emptyForm = {
  busNumber: "",
  busName: "",
  driverName: "",
  driverPhone: "",
  routeName: routeOptions[0],
  capacity: "",
  status: "Active"
};

function EditBus() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    const loadBuses = async () => {
      const data = await getBuses();
      setBuses(data);
    };
    loadBuses();
  }, []);

  const [selectedBusId, setSelectedBusId] = useState(null);

  useEffect(() => {
    if (selectedBusId !== null) return;
    if (state?.busId) {
      setSelectedBusId(state.busId);
      return;
    }
    if (buses.length) {
      setSelectedBusId(buses[0].id);
    }
  }, [buses, selectedBusId, state]);

  const bus = useMemo(
    () => buses.find((item) => item.id === selectedBusId) || null,
    [buses, selectedBusId]
  );

  const [formData, setFormData] = useState(() =>
    bus
      ? {
          busNumber: bus.busNumber,
          busName: bus.busName || "",
          driverName: bus.driver || "",
          driverPhone: bus.phone || "",
          routeName: bus.route || routeOptions[0],
          capacity: String(bus.capacity || ""),
          status: bus.status || "Active"
        }
      : emptyForm
  );
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!bus) {
      setFormData(emptyForm);
      return;
    }

    setFormData({
      busNumber: bus.busNumber,
      busName: bus.busName || "",
      driverName: bus.driver || "",
      driverPhone: bus.phone || "",
      routeName: bus.route || routeOptions[0],
      capacity: String(bus.capacity || ""),
      status: bus.status || "Active"
    });
  }, [bus]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const validationErrors = {};

    if (!/^\d{10}$/.test(formData.driverPhone.trim())) {
      validationErrors.driverPhone = "Driver phone must be exactly 10 digits.";
    }

    if (
      formData.capacity === "" ||
      Number.isNaN(Number(formData.capacity)) ||
      Number(formData.capacity) <= 0
    ) {
      validationErrors.capacity = "Capacity must be a valid number.";
    }

    return validationErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!bus) {
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setSuccessMessage("");
      return;
    }

    await updateBusRecord(bus.id, {
      busName: formData.busName.trim(),
      driver: formData.driverName.trim(),
      phone: formData.driverPhone.trim(),
      route: formData.routeName.trim(),
      capacity: Number(formData.capacity),
      status: formData.status
    });

    setErrors({});
    setSuccessMessage("Bus Updated Successfully");
    window.alert("Bus Updated Successfully");
    navigate("/buses/list");
  };

  const handleCancel = () => {
    navigate("/buses/list");
  };

  if (!buses.length) {
    return (
      <div className="add-bus-page">
        <section className="panel">
          <header className="panel-header">
            <h2>Edit Bus Details</h2>
            <span>No bus records found. Add a bus first.</span>
          </header>
          <div className="auth-role-actions">
            <button type="button" className="btn-primary" onClick={() => navigate("/buses/add")}>
              Go to Add Bus
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="add-bus-page">
      <section className="overview-hero">
        <h1>Edit Bus Details</h1>
        <p>Update bus information and keep operations up to date.</p>
      </section>

      <section className="panel add-bus-card">
        <header className="panel-header">
          <h3>Bus Details Form</h3>
          <span>Pre-filled details for selected bus</span>
        </header>

        <form className="bus-form" onSubmit={handleSubmit}>
          <label>
            Select Bus
            <select
              value={selectedBusId || ""}
              onChange={(event) => setSelectedBusId(Number(event.target.value))}
            >
              {buses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.busNumber} - {item.busName}
                </option>
              ))}
            </select>
          </label>

          <div className="add-bus-form-grid">
            <label>
              Bus Number
              <input type="text" value={formData.busNumber} disabled />
            </label>

            <label>
              Bus Name
              <input type="text" value={formData.busName} disabled />
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
              Route
              <select name="routeName" value={formData.routeName} onChange={handleChange}>
                {routeOptions.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
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
              {errors.capacity ? <small className="form-error">{errors.capacity}</small> : null}
            </label>

            <label>
              Status
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </label>
          </div>

          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          <div className="bus-form-actions">
            <button type="submit" className="btn-primary">
              Update Bus
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

export default EditBus;
