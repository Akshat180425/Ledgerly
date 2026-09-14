import { useState } from "react";
import { Link } from "react-router-dom";
import { LuTrendingUp, LuArrowUpRight, LuArrowDownLeft, LuArrowRight } from "react-icons/lu";
import useResource from "../../hooks/useResource";
import { currentMonth, chartColors, useMoney } from "../../utils/finance";
import { PageHeader, ResourceState, Stat, EmptyState, SearchInput } from "../../components/FinanceUI";
import { CashFlowChart, SpendingChart, CashLegend } from "../../components/Charts/FinanceCharts";
export default function Analytics() {
  const [month, setMonth] = useState(currentMonth()), [search, setSearch] = useState("");
  const resource = useResource("/api/v1/dashboard", { month }), money = useMoney(), data = resource.data;
  const categories = (data?.categories || []).filter((row) => row.name.toLowerCase().includes(search.toLowerCase()));
  const end = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  return <><PageHeader eyebrow="THE BIGGER PICTURE" title="Analytics"><input type="month" className="month-input" aria-label="Analytics month" value={month} min="2000-01" max="2100-12" onChange={(e) => e.target.value && setMonth(e.target.value)} /></PageHeader><ResourceState resource={resource}>{data && <><div className="stats-band"><Stat label="Net cash flow" value={money(data.net)} icon={LuTrendingUp} detail={data.transactionCount + " transactions"} /><Stat label="Savings rate" value={data.savingsRate === null ? "N/A" : data.savingsRate + "%"} icon={LuArrowDownLeft} tone="green" detail="Net cash flow as a share of income" /><Stat label="Largest expense category" value={data.categories[0]?.name || "None yet"} icon={LuArrowUpRight} tone="coral" detail={data.categories[0] ? money(data.categories[0].amount) + " / " + data.categories[0].percent + "% of expenses" : "No expenses this month"} /></div>
    <section className="chart-panel"><div className="section-heading"><div><h2>Daily activity</h2><p>Income and spending across the month</p></div><CashLegend /></div><CashFlowChart data={data.daily} daily /></section>
    <div className="dashboard-grid"><section className="chart-panel"><div className="section-heading"><h2>Spending by category</h2></div><SpendingChart categories={data.categories} /></section><section className="chart-panel"><div className="section-heading"><h2>Six-month trend</h2><CashLegend /></div><CashFlowChart data={data.trends} /></section></div>
    <section className="plain-section"><div className="section-heading"><h2>Category insights</h2><SearchInput placeholder="Search categories" value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} /></div>{categories.length ? <div className="table-scroll"><table className="transactions-table"><thead><tr><th>Category</th><th>Transactions</th><th>Share of spending</th><th className="amount-cell">Total spent</th><th /></tr></thead><tbody>{categories.map((category, i) => <tr key={category._id}><td><span className="category-name"><i style={{ background: chartColors[i % chartColors.length] }} />{category.name}</span></td><td>{category.count}</td><td>{category.percent}%</td><td className="amount-cell">{money(category.amount)}</td><td><Link className="icon-button" aria-label={"View " + category.name + " transactions"} title="View transactions" to={"/transactions?" + new URLSearchParams({ type: "expense", category: category.name, start: month + "-01", end: month + "-" + end })}><LuArrowRight /></Link></td></tr>)}</tbody></table></div> : <EmptyState title="No matching categories" />}</section>
  </>}</ResourceState></>;
}
