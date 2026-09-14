import { useState } from "react";
import { LuPlus, LuPencil, LuTrash2, LuRepeat2, LuCheck } from "react-icons/lu";
import toast from "react-hot-toast";
import useResource from "../../hooks/useResource";
import api, { errorMessage } from "../../utils/axiosInstance";
import { dateLabel, today, useMoney, expenseCategories, incomeSources } from "../../utils/finance";
import { PageHeader, ResourceState, EmptyState, IconButton, Field } from "../../components/FinanceUI";
import Modal from "../../components/Modal";
import ConfirmDelete from "../../components/ConfirmDelete";
function ScheduleForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial || { type: "expense", name: "", amount: "", frequency: "monthly", startDate: today(), endDate: "", note: "" });
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const change = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { if (initial) await api.patch("/api/v1/recurring/" + initial._id, { name: form.name, amount: form.amount, note: form.note }); else await api.post("/api/v1/recurring", form); toast.success("Schedule saved"); onSaved(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  return <form className="form-stack" onSubmit={submit}><div className="form-grid"><Field label="Type"><select value={form.type} onChange={change("type")} disabled={!!initial}><option value="expense">Expense</option><option value="income">Income</option></select></Field><Field label="Frequency"><select value={form.frequency} onChange={change("frequency")} disabled={!!initial}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></Field></div><Field label={form.type === "income" ? "Source" : "Category"} list="recurring-labels" required maxLength={100} value={form.name} onChange={change("name")} /><datalist id="recurring-labels">{(form.type === "income" ? incomeSources : expenseCategories).map((item) => <option key={item} value={item} />)}</datalist><Field label="Amount" type="number" min="0.01" max="1000000000" step="0.01" required value={form.amount} onChange={change("amount")} />{!initial && <div className="form-grid"><Field label="First date" type="date" required value={form.startDate} onChange={change("startDate")} /><Field label="End date (optional)" type="date" min={form.startDate} value={form.endDate} onChange={change("endDate")} /></div>}<Field label="Note (optional)" value={form.note} onChange={change("note")} maxLength={500} />{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="button secondary" disabled={busy} onClick={onCancel}>Cancel</button><button className="button primary" disabled={busy}><LuCheck />{busy ? "Saving..." : "Save schedule"}</button></div></form>;
}
export default function Recurring() {
  const resource = useResource("/api/v1/recurring"), money = useMoney();
  const [editing, setEditing] = useState(null), [remove, setRemove] = useState(null), [pendingToggle, setPendingToggle] = useState(null);
  const toggle = async (item) => {
    setPendingToggle({ id: item._id, active: !item.active });
    try { await api.patch("/api/v1/recurring/" + item._id, { active: !item.active }); toast.success(item.active ? "Schedule paused" : "Schedule resumed"); await resource.refresh(); }
    catch (err) { toast.error(errorMessage(err)); } finally { setPendingToggle(null); }
  };
  return <><PageHeader eyebrow="THE EVERYDAY, TAKEN CARE OF" title="Recurring transactions"><button className="button primary" onClick={() => setEditing({ new: true })}><LuPlus />New schedule</button></PageHeader><ResourceState resource={resource}>{resource.data?.length ? <div className="table-scroll"><table className="transactions-table"><thead><tr><th>Schedule</th><th>Frequency</th><th>Next date</th><th className="amount-cell">Amount</th><th>Active</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{resource.data.map((item) => { const ended = item.endDate && item.nextDate > item.endDate; return <tr key={item._id}><td><div className="table-title"><span className="transaction-icon"><LuRepeat2 /></span><div><strong>{item.name}</strong><span>{item.type}{item.note ? " / " + item.note : ""}</span></div></div></td><td className="capitalize">{item.frequency}</td><td className="nowrap">{ended ? "Completed" : dateLabel(item.nextDate)}</td><td className={"amount-cell " + item.type}>{money(item.amount)}</td><td><input type="checkbox" className="switch" aria-label={"Active schedule: " + item.name} checked={pendingToggle?.id === item._id ? pendingToggle.active : item.active} disabled={pendingToggle?.id === item._id || !!ended} onChange={() => toggle(item)} /></td><td><div className="row-actions"><IconButton label={"Edit " + item.name} onClick={() => setEditing(item)}><LuPencil /></IconButton><IconButton label={"Delete " + item.name} onClick={() => setRemove(item)}><LuTrash2 /></IconButton></div></td></tr>; })}</tbody></table><p className="table-footnote">Dates follow UTC. Resuming a paused schedule posts its missed occurrences.</p></div> : <EmptyState title="No recurring transactions yet" icon={LuRepeat2}><button className="button secondary" onClick={() => setEditing({ new: true })}><LuPlus />Create a schedule</button></EmptyState>}</ResourceState>
    <Modal title={editing?.new ? "New recurring transaction" : "Edit recurring transaction"} isOpen={!!editing} onClose={() => setEditing(null)}><ScheduleForm initial={editing?.new ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); void resource.refresh(); }} /></Modal>
    <ConfirmDelete item={remove} onClose={() => setRemove(null)} title="Delete recurring schedule?" onDelete={async (item) => { await api.delete("/api/v1/recurring/" + item._id); await resource.refresh(); }} />
  </>;
}
