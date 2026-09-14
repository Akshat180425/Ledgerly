import { useState } from "react";
import { LuCheck, LuUpload, LuUserRound } from "react-icons/lu";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";
import { PageHeader, Field } from "../../components/FinanceUI";
import GoogleSignIn from "../../components/GoogleSignIn";
import api, { errorMessage } from "../../utils/axiosInstance";
export default function Settings() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user.fullName), [currency, setCurrency] = useState(user.currency || "INR"), [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false);
  const save = async (event) => {
    event.preventDefault(); setBusy(true);
    try { const { data } = await api.put("/api/v1/auth/profile", { fullName: name, currency }); updateUser(data); toast.success("Profile updated"); }
    catch (error) { toast.error(errorMessage(error)); } finally { setBusy(false); }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Choose an image smaller than 2 MB"); return; }
    setUploading(true);
    try { const form = new FormData(); form.append("image", file); const { data } = await api.post("/api/v1/auth/upload-image", form); updateUser({ ...user, profileImageUrl: data.imageUrl }); toast.success("Photo updated"); }
    catch (error) { toast.error(errorMessage(error)); } finally { setUploading(false); event.target.value = ""; }
  };
  return <><PageHeader eyebrow="YOUR ACCOUNT" title="Settings" /><div className="settings-section"><div><h2>Profile</h2><p className="muted">{user.email}</p></div><div className="settings-fields"><div className="profile-photo"><span className="avatar large">{user.profileImageUrl ? <img src={user.profileImageUrl} alt="Your profile" /> : <LuUserRound />}</span><label className="button secondary upload-label"><LuUpload />{uploading ? "Uploading..." : "Change photo"}<input type="file" accept="image/png,image/jpeg" onChange={upload} disabled={uploading} className="sr-only" /></label><span className="field-hint">PNG or JPEG, up to 2 MB</span></div><form className="form-stack" onSubmit={save}><Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} /><Field label="Account currency"><select value={currency} onChange={(e) => setCurrency(e.target.value)}>{[["INR", "Indian rupee"], ["USD", "US dollar"], ["EUR", "Euro"], ["GBP", "British pound"], ["CAD", "Canadian dollar"], ["AUD", "Australian dollar"]].map(([code, label]) => <option key={code} value={code}>{code} / {label}</option>)}</select></Field>{currency !== user.currency && <p className="form-error">Changing currency relabels existing amounts. It does not convert exchange rates.</p>}<div className="form-actions"><button className="button primary" disabled={busy}><LuCheck />{busy ? "Saving..." : "Save changes"}</button></div></form></div></div><div className="settings-section"><div><h2>Connected accounts</h2><p className="muted">Google</p></div><div className="settings-fields">{user.googleLinked ? <span className="badge green"><LuCheck />Google connected</span> : <GoogleSignIn link onSuccess={(data) => { updateUser(data); toast.success("Google account connected"); }} />}</div></div></>;
}
