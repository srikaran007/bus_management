import api from "./api";
import { extractItems } from "./listUtils";

export async function getRoutes(params = {}) {
  const response = await api.get("/routes", { params });
  return extractItems(response.data);
}

export async function getRoutesPage(params = {}) {
  const response = await api.get("/routes", { params });
  return response.data || { items: [], pagination: { page: 1, totalPages: 1 } };
}

export async function createRoute(payload, params = {}) {
  const response = await api.post("/routes", payload, { params });
  return response.data;
}

export async function updateRoute(id, payload, params = {}) {
  const response = await api.put(`/routes/${id}`, payload, { params });
  return response.data;
}

export async function deleteRoute(id, params = {}) {
  const response = await api.delete(`/routes/${id}`, { params });
  return response.data;
}
