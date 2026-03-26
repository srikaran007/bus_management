import api from "./api";

export async function getDriverPerformance(params = {}) {
  const response = await api.get("/ml/driver-performance", { params });
  return response.data || { items: [], summary: {} };
}

export async function getSpareDriverRecommendations(params = {}) {
  const response = await api.get("/ml/driver-spares", { params });
  return response.data || { items: [] };
}

export async function getDriverSchedule(params = {}) {
  const response = await api.get("/ml/driver-schedule", { params });
  return response.data || { items: [], pagination: { page: 1, totalPages: 1 } };
}

export async function generateDriverSchedule(payload = {}) {
  const response = await api.post("/ml/driver-schedule/generate", payload);
  return response.data;
}

export async function updateDriverShiftStatus(id, payload = {}) {
  const { params, ...body } = payload;
  const response = await api.patch(`/ml/driver-schedule/${id}/status`, body, { params });
  return response.data;
}
