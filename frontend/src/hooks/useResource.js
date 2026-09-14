import { useCallback, useEffect, useRef, useState } from "react";
import api, { errorMessage } from "../utils/axiosInstance";
export default function useResource(path, params = {}) {
  const query = JSON.stringify(params);
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const sequence = useRef({ request: 0 });
  const refresh = useCallback(async () => {
    const request = ++sequence.current.request;
    setLoading(true); setError("");
    try {
      const response = await api.get(path, { params: JSON.parse(query) });
      if (request === sequence.current.request) setData(response.data);
    } catch (err) { if (request === sequence.current.request) setError(errorMessage(err)); }
    finally { if (request === sequence.current.request) setLoading(false); }
  }, [path, query]);
  useEffect(() => { const counter = sequence.current; void refresh(); return () => { counter.request++; }; }, [refresh]);
  return { data, loading, error, refresh };
}
