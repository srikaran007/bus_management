import api from "./api";
import { extractItems } from "./listUtils";

export async function getBuses(params = {}) {
  const response = await api.get("/buses", { params });
  return extractItems(response.data);
}

export function addBus(payload) {
  return api.post("/buses", payload);
}

export function updateBus(id, payload) {
  return api.put(`/buses/${id}`, payload);
}

export function deleteBus(id) {
  return api.delete(`/buses/${id}`);
}
