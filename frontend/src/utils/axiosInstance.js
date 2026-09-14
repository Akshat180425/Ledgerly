import axios from "axios";
const axiosInstance = axios.create({
  baseURL: "/", timeout: 60000, withCredentials: true,
  headers: { Accept: "application/json", "X-Ledgerly-Request": "1" },
});
axiosInstance.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !error.config?.skipAuthEvent) window.dispatchEvent(new Event("ledgerly:unauthorized"));
  return Promise.reject(error);
});
export const errorMessage = (error) => error.response?.data?.message || (error.code === "ECONNABORTED" ? "The server is taking longer than expected. Please retry." : "Unable to reach Ledgerly. Check your connection and retry.");
export default axiosInstance;
