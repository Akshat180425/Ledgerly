import { ResponsiveContainer, ComposedChart, Line, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { chartColors, useMoney } from "../../utils/finance";
import { EmptyState } from "../FinanceUI";
export function CashFlowChart({ data, daily = false }) {
  const money = useMoney();
  if (!data?.some((row) => row.income || row.expense)) return <EmptyState title="No transactions in this period" />;
  return <div className="chart-frame"><ResponsiveContainer width="100%" height="100%" minWidth={0}><ComposedChart data={data} margin={{ top: 12, right: 12, left: 8, bottom: 8 }} accessibilityLayer><CartesianGrid stroke="#e7ece9" vertical={false} /><XAxis dataKey={daily ? "day" : "label"} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#66756e" }} minTickGap={20} /><YAxis tickFormatter={(value) => money(value, true)} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#66756e" }} width={70} /><Tooltip formatter={(value, name) => [money(value), name === "income" ? "Income" : "Expenses"]} labelFormatter={(label) => daily ? "Day " + label : label} contentStyle={{ border: "1px solid #dce5df", borderRadius: 8, fontSize: 12 }} />{daily ? <><Line type="monotone" isAnimationActive={false} dataKey="income" stroke="#0c8873" strokeWidth={2.5} dot={false} /><Line type="monotone" isAnimationActive={false} dataKey="expense" stroke="#e48c57" strokeWidth={2.5} dot={false} /></> : <><Bar isAnimationActive={false} dataKey="income" fill="#0c8873" radius={[3, 3, 0, 0]} maxBarSize={22} /><Bar isAnimationActive={false} dataKey="expense" fill="#e6a079" radius={[3, 3, 0, 0]} maxBarSize={22} /></>}</ComposedChart></ResponsiveContainer></div>;
}
export function SpendingChart({ categories }) {
  const money = useMoney();
  if (!categories?.length) return <EmptyState title="No expenses in this period" />;
  const data = categories.slice(0, 5).map((item) => ({ name: item.name, amount: item.amount }));
  if (categories.length > 5) data.push({ name: "Other categories", amount: categories.slice(5).reduce((sum, item) => sum + item.amount, 0) });
  return <div className="spending-chart"><div className="donut-frame"><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart accessibilityLayer><Pie isAnimationActive={false} data={data} dataKey="amount" nameKey="name" innerRadius="62%" outerRadius="86%" paddingAngle={3} stroke="none">{data.map((row, i) => <Cell key={row.name} fill={chartColors[i % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => money(value)} contentStyle={{ borderRadius: 8, fontSize: 12 }} /></PieChart></ResponsiveContainer></div><div className="chart-legend">{data.map((item, i) => <div key={item.name}><span className="legend-dot" style={{ background: chartColors[i % chartColors.length] }} /><span>{item.name}</span><strong>{money(item.amount)}</strong></div>)}</div></div>;
}
export function CashLegend() { return <div className="cash-legend"><span><i style={{ background: "#0c8873" }} />Income</span><span><i style={{ background: "#e6a079" }} />Expenses</span></div>; }
