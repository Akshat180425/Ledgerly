import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import UserProvider from "./context/UserContext";
import { useAuth } from "./context/authContext";
import { Loading, ErrorState } from "./components/FinanceUI";
import DashboardLayout from "./components/layouts/DashboardLayout";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
const Home = lazy(() => import("./pages/Dashboard/Home"));
const Transactions = lazy(() => import("./pages/Dashboard/Transactions"));
const Budgets = lazy(() => import("./pages/Dashboard/Budgets"));
const Goals = lazy(() => import("./pages/Dashboard/Goals"));
const Recurring = lazy(() => import("./pages/Dashboard/Recurring"));
const Analytics = lazy(() => import("./pages/Dashboard/Analytics"));
const Settings = lazy(() => import("./pages/Dashboard/Settings"));
function Protected() {
  const { user, loading, error, refresh } = useAuth(), location = useLocation();
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <DashboardLayout><Suspense fallback={<Loading />}><Outlet /></Suspense></DashboardLayout>;
}
export default function App() {
  return <UserProvider><BrowserRouter><a className="skip-link" href="#main-content">Skip to content</a><Routes>
    <Route path="/login" element={<Login />} /><Route path="/signup" element={<SignUp />} />
    <Route element={<Protected />}>
      <Route path="/dashboard" element={<Home />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/income" element={<Transactions fixedType="income" />} />
      <Route path="/expense" element={<Transactions fixedType="expense" />} />
      <Route path="/budgets" element={<Budgets />} /><Route path="/goals" element={<Goals />} />
      <Route path="/recurring" element={<Recurring />} /><Route path="/analytics" element={<Analytics />} />
      <Route path="/settings" element={<Settings />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes></BrowserRouter><Toaster position="bottom-right" containerClassName="ledgerly-notifications" toastOptions={{ duration: 4500, style: { fontSize: "14px", borderRadius: "8px" } }} /></UserProvider>;
}
