import axios from "axios";

// prefer the new variable name for clarity; keep old name as a fallback for existing .env files
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de request: agrega token si existe
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.warn("No se pudo acceder al token:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response: manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      error.name = "CanceledError"; 
    }

    const status = error.response?.status ?? null;
    const data = error.response?.data ?? null;

    if (status === 401) {
      localStorage.removeItem("token");
     
    }

    return Promise.reject({
      status,
      data,
      message: error.message,
    });
  }
);

export default api;
