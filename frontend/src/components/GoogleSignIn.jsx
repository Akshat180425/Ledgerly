import { useEffect, useRef, useState } from "react";
import api, { errorMessage } from "../utils/axiosInstance";
let scriptPromise;
function loadGoogle() {
  if (window.google?.accounts) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client"; script.async = true;
    script.onload = resolve;
    script.onerror = () => { script.remove(); scriptPromise = null; reject(new Error("Google sign-in could not load. Please retry.")); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}
export default function GoogleSignIn({ onSuccess, link = false }) {
  const container = useRef(null), callback = useRef(onSuccess);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [configured, setConfigured] = useState(false);
  useEffect(() => { callback.current = onSuccess; }, [onSuccess]);
  useEffect(() => {
    let cancelled = false;
    api.get("/api/v1/auth/config").then(async ({ data }) => {
      if (!data.googleClientId || cancelled) return;
      setConfigured(true);
      await loadGoogle();
      if (cancelled || !container.current) return;
      window.google.accounts.id.initialize({
        client_id: data.googleClientId,
        callback: async ({ credential }) => {
          setBusy(true); setError("");
          try { const response = await api.post("/api/v1/auth/google" + (link ? "/link" : ""), { credential }, { skipAuthEvent: true }); callback.current(response.data.user || response.data); }
          catch (err) { setError(errorMessage(err)); }
          finally { setBusy(false); }
        },
      });
      window.google.accounts.id.renderButton(container.current, { theme: "outline", size: "large", shape: "rectangular", text: link ? "continue_with" : "signin_with", width: Math.min(360, container.current.clientWidth || 280) });
    }).catch((err) => { if (!cancelled) setError(err.message || "Google sign-in is unavailable."); });
    return () => { cancelled = true; };
  }, [link]);
  return <div className={"google-signin " + (!configured && !error && !link ? "hidden" : "")}>{link && !configured && !error && <p className="muted">Google sign-in is not available yet.</p>}{!link && configured && <div className="auth-divider"><span>or</span></div>}<div ref={container} className={busy ? "pointer-events-none opacity-60" : ""} />{busy && <p role="status" className="muted">Signing in...</p>}{error && <p role="alert" className="form-error">{error}</p>}</div>;
}
