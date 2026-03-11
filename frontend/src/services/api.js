import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshRequest = null;

const clearSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("currentUser");
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken || refreshToken === "undefined" || refreshToken === "null") {
    throw new Error("Session expired. Please login again.");
  }

  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  const { accessToken, refreshToken: nextRefreshToken, user } = response.data || {};

  if (!accessToken) {
    throw new Error("Unable to refresh session.");
  }

  localStorage.setItem("accessToken", accessToken);
  if (nextRefreshToken) localStorage.setItem("refreshToken", nextRefreshToken);
  if (user) localStorage.setItem("currentUser", JSON.stringify(user));

  return accessToken;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const requestUrl = String(originalRequest?.url || "");

    const canRetry =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes("/auth/login") &&
      !requestUrl.includes("/auth/refresh");

    if (!canRetry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = refreshAccessToken().finally(() => {
          refreshRequest = null;
        });
      }

      const newAccessToken = await refreshRequest;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearSession();
      const role = window.location.pathname.split("/")[1];
      const validRoles = ["admin", "transport", "staff", "driver", "student"];
      const target = validRoles.includes(role) ? `/auth/${role}` : "/";
      window.location.assign(target);
      return Promise.reject(refreshError);
    }
  }
);

export default api;
