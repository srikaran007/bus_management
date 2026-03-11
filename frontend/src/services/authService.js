import api from "./api";

export function login(payload) {
  return api.post("/auth/login", payload);
}

export function me() {
  return api.get("/auth/me");
}
