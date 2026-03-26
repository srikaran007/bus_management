import api from "./api";
import { extractItems } from "./listUtils";

export async function getDrivers(params = {}) {
  const response = await api.get("/drivers", { params });
  return extractItems(response.data);
}

export async function getDriversPage(params = {}) {
  const response = await api.get("/drivers", { params });
  return response.data || { items: [], pagination: { page: 1, totalPages: 1 } };
}

export async function createDriver(payload, params = {}) {
  const response = await api.post("/drivers", payload, { params });
  return response.data;
}

export async function updateDriver(id, payload, params = {}) {
  const response = await api.put(`/drivers/${id}`, payload, { params });
  return response.data;
}

export async function deleteDriver(id, params = {}) {
  const response = await api.delete(`/drivers/${id}`, { params });
  return response.data;
}
