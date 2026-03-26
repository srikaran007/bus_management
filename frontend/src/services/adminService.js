import api from "./api";

export async function getDashboardSummary() {
  const response = await api.get("/admin/dashboard-summary");
  return response.data || { totals: {}, institutions: [] };
}

export async function getBusInchargeAssignments() {
  const response = await api.get("/admin/bus-incharge-assignments");
  return response.data || { items: [], availableStaff: [] };
}

export async function assignBusIncharge(busId, staffUserId = null) {
  const response = await api.patch(`/admin/bus-incharge-assignments/${busId}`, { staffUserId });
  return response.data;
}
