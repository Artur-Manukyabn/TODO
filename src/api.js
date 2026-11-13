import axios from "axios";

const isLocalDev =
  typeof window !== "undefined" && window.location.hostname === "localhost";

const API = axios.create({
  baseURL: isLocalDev ? "http://localhost:5000/api" : "/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
