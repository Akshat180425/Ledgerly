import { useState } from "react";
import { LuPlus, LuPencil, LuTrash2, LuWallet, LuTriangleAlert, LuCheck } from "react-icons/lu";
import toast from "react-hot-toast";
import useResource from "../../hooks/useResource";
import api, { errorMessage } from "../../utils/axiosInstance";
import { currentMonth, expenseCategories, useMoney } from "../../utils/finance";
import { PageHeader, ResourceState, EmptyState, IconButton, Field, Progress } from "../../components/FinanceUI";
import Modal from "../../components/Modal";
import ConfirmDelete from "../../components/ConfirmDelete";
function BudgetForm({ initial, month, onSaved, onCancel }) {
  const [scope, setScope] = useState(initial?.categoryKey === "*" ? "overall" : "category");
  const [category, setCategory] = useState(initial?.category || ""), [amount, setAmount] = useState(initial?.amount || ""), [threshold, setThreshold] = useState(initial?.warningThreshold || 80);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { const payload = { scope, category, amount, month, warningThreshold: threshold }; if (initial) await api.put("/api/v1/budgets/" + initial._id, payload); else await api.post("/api/v1/budgets", payload); toast.success("Budget saved"); onSaved(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  return <form className="form-stack" onSubmit={submit}><Field label="Budget for"><select value={scope} onChange={(e) => setScope(e.target.value)}><option value="category">A category</option><option value="overall">All spending</option></select></Field>{scope === "category" && <><Field label="Category" list="budget-categories" value={category} onChange={(e) => setCategory(e.target.value)} required maxLength={100} /><datalist id="budget-categories">{expenseCategories.map((item) => <option key={item} value={item} />)}</datalist></>}<Field label="Monthly limit" type="number" min="0.01" max="1000000000" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} /><Field label={"Warn at " + threshold + "%"}><input type="range" min="1" max="100" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></Field>{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="button secondary" onClick={onCancel} disabled={busy}>Cancel</button><button className="button primary" disabled={busy}><LuCheck />{busy ? "Saving..." : "Save budget"}</button></div></form>;
}
export default function Budgets() {
  const [month, setMonth] = useState(currentMonth()), [editing, setEditing] = useState(null), [remove, setRemove] = useState(null);
  const resource = useResource("/api/v1/budgets", { month }), money = useMoney();
  const warnings = (resource.data || []).filter((item) => item.status !== "on-track");
  return <><PageHeader eyebrow="SPEND WITH INTENTION" title="Budgets"><input className="month-input" type="month" aria-label="Budget month" value={month} min="2000-01" max="2100-12" onChange={(e) => e.target.value && setMonth(e.target.value)} /><button className="button primary" onClick={() => setEditing({ new: true })}><LuPlus />New budget</button></PageHeader>
    <ResourceState resource={resource}>{warnings.length > 0 && <div className="warning-banner" role="status"><LuTriangleAlert /><span>{warnings.length} {warnings.length === 1 ? "budget needs" : "budgets need"} attention this month.</span></div>}
      {resource.data?.length ? <div className="item-grid">{resource.data.map((budget) => <article className="budget-item" key={budget._id}><div className="item-heading"><span className="item-symbol"><LuWallet /></span><div><h2>{budget.category}</h2><span className="muted">{budget.categoryKey === "*" ? "Overall monthly limit" : "Monthly category limit"}</span></div><div className="row-actions"><IconButton label={"Edit " + budget.category} onClick={() => setEditing(budget)}><LuPencil /></IconButton><IconButton label={"Delete " + budget.category} onClick={() => setRemove(budget)}><LuTrash2 /></IconButton></div></div><div className="budget-amount"><strong>{money(budget.spent)}</strong><span>of {money(budget.amount)}</span></div><Progress value={budget.percent} label={budget.category + " spending"} tone={budget.status === "exceeded" ? "red" : budget.status === "warning" ? "amber" : "green"} /><div className="budget-footer"><span className={"badge " + (budget.status === "exceeded" ? "red" : budget.status === "warning" ? "amber" : "green")}>{budget.status === "exceeded" ? "Limit reached" : budget.status === "warning" ? "Near limit" : "On track"}</span><strong>{budget.remaining < 0 ? money(-budget.remaining) + " over" : money(budget.remaining) + " left"}</strong></div><p className="field-hint">Warning at {budget.warningThreshold}% / {Math.round(budget.percent)}% used</p></article>)}</div> : <EmptyState title="No budgets for this month" icon={LuWallet}><button className="button secondary" onClick={() => setEditing({ new: true })}><LuPlus />Create a budget</button></EmptyState>}
    </ResourceState><Modal title={editing?.new ? "New budget" : "Edit budget"} isOpen={!!editing} onClose={() => setEditing(null)}><BudgetForm initial={editing?.new ? null : editing} month={month} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); void resource.refresh(); }} /></Modal><ConfirmDelete item={remove} onClose={() => setRemove(null)} title="Delete budget?" onDelete={async (item) => { await api.delete("/api/v1/budgets/" + item._id); await resource.refresh(); }} /></>;
}
