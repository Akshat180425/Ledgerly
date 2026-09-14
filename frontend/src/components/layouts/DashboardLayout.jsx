import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { LuLayoutDashboard, LuArrowRightLeft, LuChartNoAxesCombined, LuTarget, LuRepeat2, LuWallet, LuSettings2, LuLogOut, LuMenu, LuX } from "react-icons/lu";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";
import { errorMessage } from "../../utils/axiosInstance";
const navigation = [
  ["/dashboard", "Overview", LuLayoutDashboard], ["/transactions", "Transactions", LuArrowRightLeft],
  ["/budgets", "Budgets", LuWallet], ["/goals", "Savings goals", LuTarget],
  ["/recurring", "Recurring", LuRepeat2], ["/analytics", "Analytics", LuChartNoAxesCombined],
];
export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const location = useLocation();
  const signOut = async () => { setBusy(true); try { await logout(); } catch (error) { toast.error(errorMessage(error)); } finally { setBusy(false); } };
  return <div className="app-shell">
    <header className="mobile-header"><Link to="/dashboard" className="brand"><img src="/assets/images/Logo/Transparent_NoName.png" alt="" />Ledgerly<span className="brand-dot" /></Link><button className="icon-button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <LuX /> : <LuMenu />}</button></header>
    {open && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside className={"sidebar " + (open ? "is-open" : "")}>
      <Link to="/dashboard" className="brand"><img src="/assets/images/Logo/Transparent_NoName.png" alt="" />Ledgerly<span className="brand-dot" /></Link>
      <p className="nav-label">YOUR WORKSPACE</p>
      <nav aria-label="Main navigation">{navigation.map(([path, label, Icon]) => <NavLink key={path} to={path} onClick={() => setOpen(false)} className={({ isActive }) => "nav-item " + ((isActive || (path === "/transactions" && ["/income", "/expense"].includes(location.pathname))) ? "active" : "")}><Icon /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><NavLink to="/settings" className={({ isActive }) => "nav-item " + (isActive ? "active" : "")} onClick={() => setOpen(false)}><LuSettings2 /> Settings</NavLink><div className="account-row"><span className="avatar">{user?.profileImageUrl ? <img src={user.profileImageUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : user?.fullName?.slice(0, 1).toUpperCase()}</span><div><strong>{user?.fullName}</strong><span>{user?.currency || "INR"} account</span></div><button className="icon-button" aria-label="Sign out" title="Sign out" disabled={busy} onClick={signOut}><LuLogOut /></button></div></div>
    </aside>
    <main className="main-content" id="main-content">{children}</main>
  </div>;
}
