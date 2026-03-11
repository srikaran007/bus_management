import api from "./api";
import { extractItems } from "./listUtils";

export async function getAttendance(params = {}) {
  const response = await api.get("/attendance", { params });
  return extractItems(response.data);
}

export async function markAttendance(payload) {
  const response = await api.post("/attendance", payload);
  return response.data;
}

export async function getEntryExitLogs(params = {}) {
  const response = await api.get("/attendance/entry-exit", { params });
  return extractItems(response.data);
}

export async function createEntryExitLog(payload) {
  const response = await api.post("/attendance/entry-exit", payload);
  return response.data;
}
