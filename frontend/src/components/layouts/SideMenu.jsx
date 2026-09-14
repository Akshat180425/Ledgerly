import { Link } from "react-router-dom";
export default function SideMenu() { return <nav aria-label="Finance navigation"><Link to="/dashboard">Overview</Link><Link to="/transactions">Transactions</Link></nav>; }
