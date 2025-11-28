import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.1.147:3000/api",
  withCredentials: true,
  timeout: 10000,
});

// Add request interceptor for auth token if needed
axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to auth page on unauthorized
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
