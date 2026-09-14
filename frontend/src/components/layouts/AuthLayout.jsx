import { Link } from "react-router-dom";
export default function AuthLayout({ children }) {
  return <main className="auth-layout" id="main-content"><header><Link to="/login" className="brand"><img src="/assets/images/Logo/Transparent_NoName.png" alt="" />Ledgerly<span className="brand-dot" /></Link></header><div className="auth-content">{children}</div><footer>Ledgerly / Personal finance</footer></main>;
}
