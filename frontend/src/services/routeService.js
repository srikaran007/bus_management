import api from "./api";
import { extractItems } from "./listUtils";

export async function getRoutes(params = {}) {
  const response = await api.get("/routes", { params });
  return extractItems(response.data);
}

export async function createRoute(payload) {
  const response = await api.post("/routes", payload);
  return response.data;
}

export async function updateRoute(id, payload) {
  const response = await api.put(`/routes/${id}`, payload);
  return response.data;
}

export async function deleteRoute(id) {
  const response = await api.delete(`/routes/${id}`);
  return response.data;
}
