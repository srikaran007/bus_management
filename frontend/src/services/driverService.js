import api from "./api";
import { extractItems } from "./listUtils";

export async function getDrivers(params = {}) {
  const response = await api.get("/drivers", { params });
  return extractItems(response.data);
}

export async function createDriver(payload) {
  const response = await api.post("/drivers", payload);
  return response.data;
}

export async function updateDriver(id, payload) {
  const response = await api.put(`/drivers/${id}`, payload);
  return response.data;
}

export async function deleteDriver(id) {
  const response = await api.delete(`/drivers/${id}`);
  return response.data;
}
