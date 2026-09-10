import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
});

export function getApiError(error: unknown, fallback = "Unable to connect to the server. Please try again.") {
  const response = (error as any)?.response?.data;
  return { message: response?.message || fallback, code: response?.code, errors: response?.errors || {} };
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("findit_seller_token");
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
