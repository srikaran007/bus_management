import api from "./api";
import { extractItems } from "./listUtils";

export async function getStudents(params = {}) {
  const response = await api.get("/students", { params });
  return extractItems(response.data);
}

export async function createStudent(payload) {
  const response = await api.post("/students", payload);
  return response.data;
}

export async function updateStudent(id, payload) {
  const response = await api.put(`/students/${id}`, payload);
  return response.data;
}

export async function deleteStudent(id) {
  const response = await api.delete(`/students/${id}`);
  return response.data;
}

export async function getStudentById(id) {
  const response = await api.get(`/students/${id}`);
  return response.data;
}

export async function getMyStudentProfile() {
  const response = await api.get("/students/me");
  return response.data;
}
