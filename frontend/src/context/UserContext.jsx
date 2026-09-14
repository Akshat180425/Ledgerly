import { useCallback, useEffect, useRef, useState } from "react";
import { UserContext } from "./authContext";
import api, { errorMessage } from "../utils/axiosInstance";
export default function UserProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const authRequest = useRef(0);
  const updateUser = useCallback((data) => {
    authRequest.current++; setUser(data); setLoading(false); setError("");
  }, []);
  const clearUser = useCallback(() => {
    authRequest.current++; setUser(null); setLoading(false); setError("");
  }, []);
  const refresh = useCallback(async () => {
    const request = ++authRequest.current;
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/api/v1/auth/getUser", { skipAuthEvent: true });
      if (request === authRequest.current) setUser(data);
    } catch (err) {
      if (request === authRequest.current) {
        if (err.response?.status === 401) setUser(null);
        else setError(errorMessage(err));
      }
    } finally { if (request === authRequest.current) setLoading(false); }
  }, []);
  useEffect(() => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    void refresh();
    window.addEventListener("ledgerly:unauthorized", clearUser);
    return () => window.removeEventListener("ledgerly:unauthorized", clearUser);
  }, [refresh, clearUser]);
  const logout = async () => {
    try { await api.post("/api/v1/auth/logout"); } catch (err) { if (err.response?.status !== 401) throw err; }
    clearUser();
  };
  return <UserContext.Provider value={{ user, updateUser, clearUser, loading, error, refresh, logout }}>{children}</UserContext.Provider>;
}
