import { useState } from "react";
import { Link } from "react-router-dom";
import { LuPlus, LuWallet, LuArrowDownLeft, LuArrowUpRight, LuArrowRight, LuTriangleAlert, LuTarget } from "react-icons/lu";
import useResource from "../../hooks/useResource";
import { useAuth } from "../../context/authContext";
import { currentMonth, monthLabel, useMoney } from "../../utils/finance";
import { PageHeader, ResourceState, Stat, EmptyState, Progress, TransactionRow } from "../../components/FinanceUI";
import { CashFlowChart, SpendingChart, CashLegend } from "../../components/Charts/FinanceCharts";
import TransactionForm from "../../components/TransactionForm";
import Modal from "../../components/Modal";
export default function Home() {
  const [month, setMonth] = useState(currentMonth()), [adding, setAdding] = useState(false);
  const resource = useResource("/api/v1/dashboard", { month }), money = useMoney(), { user } = useAuth();
  const data = resource.data;
  const warnings = (data?.budgets || []).filter((budget) => budget.status !== "on-track");
  return <><PageHeader eyebrow={"HELLO, " + (user?.fullName?.split(" ")[0] || "THERE").toUpperCase()} title="Your money at a glance"><input className="month-input" type="month" aria-label="Dashboard month" value={month} min="2000-01" max="2100-12" onChange={(e) => e.target.value && setMonth(e.target.value)} /><button className="button primary" onClick={() => setAdding(true)}><LuPlus />Add transaction</button></PageHeader>
    <ResourceState resource={resource}>{data && <>
      <div className="stats-band"><Stat label="Total balance" value={money(data.totalBalance)} icon={LuWallet} detail="Across all recorded transactions" /><Stat label="Income" value={money(data.income)} icon={LuArrowDownLeft} tone="green" detail={monthLabel(month)} /><Stat label="Expenses" value={money(data.expense)} icon={LuArrowUpRight} tone="coral" detail={monthLabel(month)} /></div>
      {warnings.length > 0 && <Link to={"/budgets"} className="warning-banner"><LuTriangleAlert /><span>{warnings.map((budget) => budget.category + ": " + Math.round(budget.percent) + "% of budget").join(" / ")}</span><LuArrowRight /></Link>}
      <div className="dashboard-grid"><section className="chart-panel"><div className="section-heading"><div><h2>Cash flow</h2><p>Six-month income and expenses</p></div><CashLegend /></div><CashFlowChart data={data.trends} /></section><section className="chart-panel"><div className="section-heading"><div><h2>Spending breakdown</h2><p>{monthLabel(month)}</p></div><Link className="icon-button" title="View analytics" aria-label="View analytics" to="/analytics"><LuArrowRight /></Link></div><SpendingChart categories={data.categories} /></section></div>
      <div className="dashboard-grid lower-grid"><section className="plain-section"><div className="section-heading"><h2>Recent transactions</h2><Link className="text-link" to="/transactions">View all<LuArrowRight /></Link></div>{data.recentTransactions.length ? data.recentTransactions.map((item) => <TransactionRow key={item._id} item={item} />) : <EmptyState title="No transactions this month"><button className="button secondary" onClick={() => setAdding(true)}><LuPlus />Add transaction</button></EmptyState>}</section>
      <section className="plain-section"><div className="section-heading"><h2>Savings goals</h2><Link className="text-link" to="/goals">View all<LuArrowRight /></Link></div>{data.goals.length ? data.goals.slice(0, 3).map((goal) => <div className="goal-preview" key={goal._id}><div><strong>{goal.name}</strong><span>{Math.round(goal.percent)}%</span></div><Progress value={goal.percent} label={goal.name} /><p>{money(goal.savedAmount)}<span>of {money(goal.targetAmount)}</span></p></div>) : <EmptyState icon={LuTarget} title="What are you saving for?"><Link className="button secondary" to="/goals"><LuPlus />New savings goal</Link></EmptyState>}</section></div>
    </>}</ResourceState>
    <Modal title="Add transaction" isOpen={adding} onClose={() => setAdding(false)}><TransactionForm onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); void resource.refresh(); }} /></Modal>
  </>;
}
