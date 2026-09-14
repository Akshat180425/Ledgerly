import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LuEye, LuEyeOff, LuArrowRight } from "react-icons/lu";
import AuthLayout from "../../components/layouts/AuthLayout";
import GoogleSignIn from "../../components/GoogleSignIn";
import { Field, Loading, ErrorState } from "../../components/FinanceUI";
import { useAuth } from "../../context/authContext";
import api, { errorMessage } from "../../utils/axiosInstance";
export default function Login({ signup = false }) {
  const { user, updateUser, loading, error: authError, refresh } = useAuth();
  const [fullName, setFullName] = useState(""), [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [show, setShow] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const navigate = useNavigate(), location = useLocation();
  const destination = location.state?.from || "/dashboard";
  if (loading) return <Loading />;
  if (authError) return <ErrorState message={authError} retry={refresh} />;
  if (user) return <Navigate to={destination} replace />;
  const success = (data) => { updateUser(data); navigate(destination, { replace: true }); };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { const { data } = await api.post("/api/v1/auth/" + (signup ? "register" : "login"), { fullName, email, password }, { skipAuthEvent: true }); success(data.user); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  return <AuthLayout><p className="eyebrow">YOUR MONEY, IN PERSPECTIVE</p><h1>{signup ? "Create your account" : "Welcome back."}</h1><p className="auth-subtitle">{signup ? "A fresh start for your finances." : "Let's check in on your finances."}</p>
    <form className="form-stack" onSubmit={submit}>
      {signup && <Field label="Full name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />}
      <Field label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} />
      <Field label="Password"><div className="password-field"><input type={show ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={signup ? 10 : undefined} maxLength={72} /><button type="button" className="icon-button" title={show ? "Hide password" : "Show password"} aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <LuEyeOff /> : <LuEye />}</button></div></Field>
      {signup && <span className="field-hint">At least 10 characters.</span>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary auth-submit" disabled={busy}>{busy ? "Please wait..." : signup ? "Create account" : "Sign in"}<LuArrowRight /></button>
    </form>
    <GoogleSignIn onSuccess={success} />
    <p className="auth-switch">{signup ? "Already have an account?" : "New to Ledgerly?"} <Link to={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create an account"}</Link></p>
  </AuthLayout>;
}
