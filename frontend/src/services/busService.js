import api from "./api";
import { extractItems } from "./listUtils";

export async function getBuses(params = {}) {
  const response = await api.get("/buses", { params });
  return extractItems(response.data);
}

export async function getBusesPage(params = {}) {
  const response = await api.get("/buses", { params });
  return response.data || { items: [], pagination: { page: 1, totalPages: 1 } };
}

export async function addBus(payload, params = {}) {
  const response = await api.post("/buses", payload, { params });
  return response.data;
}

export async function updateBus(id, payload, params = {}) {
  const response = await api.put(`/buses/${id}`, payload, { params });
  return response.data;
}

export async function deleteBus(id, params = {}) {
  const response = await api.delete(`/buses/${id}`, { params });
  return response.data;
}
