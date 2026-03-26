import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  generateDriverSchedule,
  getDriverPerformance,
  getDriverSchedule,
  getSpareDriverRecommendations,
  updateDriverShiftStatus
} from "../../services/mlService";
import { getCurrentUser } from "../../services/sessionService";

const institutions = [
  "N.S Eng Clg",
  "N.S Arts Clg",
  "N.S Matric School",
  "N.S Public School",
  "Vidyalaya School",
  "BEd Clg"
];

function DriverSmartScheduler() {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isAdmin = currentUser?.role === "admin";
  const isTransport = currentUser?.role === "transport";
  const defaultInstitution = currentUser?.institution || institutions[0];

  const [institution, setInstitution] = useState(defaultInstitution);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [performanceRows, setPerformanceRows] = useState([]);
  const [spareRows, setSpareRows] = useState([]);
  const [scheduleRows, setScheduleRows] = useState([]);

  const lowRiskCount = useMemo(
    () => performanceRows.filter((row) => row.predictedRisk === "Low").length,
    [performanceRows]
  );

  const loadData = useCallback(async () => {
    setError("");
    try {
      const scopedParams = isAdmin ? { institution } : {};

      if (isAdmin) {
        const [performance, spares, schedule] = await Promise.all([
          getDriverPerformance({ lookbackDays, ...scopedParams }),
          getSpareDriverRecommendations({ lookbackDays, limit: 5, ...scopedParams }),
          getDriverSchedule({ scheduleDate, limit: 200, ...scopedParams })
        ]);

        setPerformanceRows(performance.items || []);
        setSpareRows(spares.items || []);
        setScheduleRows(schedule.items || []);
        return;
      }

      const schedule = await getDriverSchedule({ scheduleDate, limit: 200 });
      setPerformanceRows([]);
      setSpareRows([]);
      setScheduleRows(schedule.items || []);
    } catch (_error) {
      setError("Unable to load ML scheduler data.");
    }
  }, [lookbackDays, scheduleDate, institution, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async (overwrite = true) => {
    if (!isAdmin) return;

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await generateDriverSchedule({
        scheduleDate,
        lookbackDays,
        overwrite,
        institution
      });
      setMessage(`Schedule generated with ${response.totalAssignments || 0} assignments.`);
      await loadData();
    } catch (_error) {
      setError("Schedule generation failed. Check route and driver data.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    if (!isAdmin) return;

    try {
      const updated = await updateDriverShiftStatus(id, {
        status,
        params: { institution }
      });
      setScheduleRows((prev) => prev.map((row) => (String(row.id) === String(id) ? updated : row)));
    } catch (_error) {
      setError("Unable to update shift status.");
    }
  };

  return (
    <div className="admin-overview">
      <section className="overview-hero">
        <h1>Driver Smart Scheduler (ML)</h1>
        <p>
          {isTransport
            ? "View generated primary and spare driver schedule."
            : "Predict driver reliability, assign primary drivers to routes, and keep spare drivers ready."}
        </p>
      </section>

      {error ? <p className="error-message">{error}</p> : null}
      {message ? <p style={{ color: "#0f766e", marginBottom: "12px" }}>{message}</p> : null}

      <section className="metrics-grid">
        {isAdmin ? (
          <>
            <article className="metric-card metric-accent-red">
              <p className="metric-title">Drivers Evaluated</p>
              <h2 className="metric-value">{performanceRows.length}</h2>
            </article>
            <article className="metric-card metric-accent-light">
              <p className="metric-title">Low Risk Drivers</p>
              <h2 className="metric-value">{lowRiskCount}</h2>
            </article>
            <article className="metric-card metric-accent-light">
              <p className="metric-title">Spare Suggestions</p>
              <h2 className="metric-value">{spareRows.length}</h2>
            </article>
          </>
        ) : null}
        <article className="metric-card metric-accent-teal">
          <p className="metric-title">Planned Shifts</p>
          <h2 className="metric-value">{scheduleRows.length}</h2>
        </article>
      </section>

      <section className="panel" style={{ marginBottom: "16px" }}>
        <header className="panel-header">
          <h3>{isAdmin ? "Generate Schedule" : "Schedule View"}</h3>
          <span>
            {isAdmin
              ? "Use attendance + trip logs to build primary/spare assignment"
              : "Transport Incharge can view schedule. Only Admin can generate or edit."}
          </span>
        </header>
        <div className="bus-form" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {isAdmin ? (
            <label>
              Institution
              <select value={institution} onChange={(event) => setInstitution(event.target.value)}>
                {institutions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            Schedule Date
            <input
              type="date"
              value={scheduleDate}
              onChange={(event) => setScheduleDate(event.target.value)}
            />
          </label>
          {isAdmin ? (
            <label>
              Lookback Days
              <input
                type="number"
                min="7"
                max="180"
                value={lookbackDays}
                onChange={(event) => setLookbackDays(Number(event.target.value) || 30)}
              />
            </label>
          ) : null}
          <div className="bus-form-actions" style={{ alignSelf: "end" }}>
            {isAdmin ? (
              <button className="btn-primary" type="button" disabled={loading} onClick={() => handleGenerate(true)}>
                {loading ? "Generating..." : "Generate ML Schedule"}
              </button>
            ) : null}
            <button className="btn-secondary" type="button" disabled={loading} onClick={loadData}>
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="content-grid" style={{ gridTemplateColumns: isAdmin ? "1.3fr 1fr" : "1fr" }}>
        <article className="panel">
          <header className="panel-header">
            <h3>Route Assignments</h3>
            <span>Primary and spare drivers for {scheduleDate}</span>
          </header>
          <div className="table-wrap">
            <table className="bus-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Bus</th>
                  <th>Primary</th>
                  <th>Spare</th>
                  <th>Risk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.length ? (
                  scheduleRows.map((row) => (
                    <tr key={row.id || row._id}>
                      <td>{row.routeName}</td>
                      <td>{row.busNumber || "-"}</td>
                      <td>{row.primaryDriverDetails?.driverName || row.primaryDriverCode || "-"}</td>
                      <td>{row.spareDriverDetails?.driverName || row.spareDriverCode || "-"}</td>
                      <td>{row.predictedRisk}</td>
                      <td>
                        {isAdmin ? (
                          <select
                            value={row.status || "Planned"}
                            onChange={(event) => handleStatusChange(row.id || row._id, event.target.value)}
                          >
                            <option value="Planned">Planned</option>
                            <option value="InProgress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        ) : (
                          row.status || "Planned"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No schedule generated for this date.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        {isAdmin ? (
          <article className="panel">
            <header className="panel-header">
              <h3>Top Spare Drivers</h3>
              <span>Best fallback options from ML scoring + workload</span>
            </header>
            <div className="table-wrap">
              <table className="bus-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Score</th>
                    <th>Risk</th>
                    <th>KM Today</th>
                    <th>Mins Today</th>
                  </tr>
                </thead>
                <tbody>
                  {spareRows.length ? (
                    spareRows.map((row) => (
                      <tr key={row.driverId}>
                        <td>{row.driverName}</td>
                        <td>{row.predictedReliability}</td>
                        <td>{row.predictedRisk}</td>
                        <td>{Number(row.workload?.totalDistanceKm || 0).toFixed(2)}</td>
                        <td>{Number(row.workload?.totalDriveMinutes || 0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No spare recommendations yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}

export default DriverSmartScheduler;
