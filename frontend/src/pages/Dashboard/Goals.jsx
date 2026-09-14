import { useState } from "react";
import { LuPlus, LuPencil, LuTrash2, LuTarget, LuCheck, LuHistory } from "react-icons/lu";
import toast from "react-hot-toast";
import useResource from "../../hooks/useResource";
import api, { errorMessage } from "../../utils/axiosInstance";
import { dateLabel, today, useMoney } from "../../utils/finance";
import { PageHeader, ResourceState, EmptyState, IconButton, Field, Progress } from "../../components/FinanceUI";
import Modal from "../../components/Modal";
import ConfirmDelete from "../../components/ConfirmDelete";
function GoalForm({ initial, contribution, onSaved, onCancel }) {
  const [name, setName] = useState(initial?.name || ""), [targetAmount, setTarget] = useState(initial?.targetAmount || ""), [targetDate, setDate] = useState(initial?.targetDate?.slice(0, 10) || "");
  const [amount, setAmount] = useState(""), [type, setType] = useState("deposit"), [note, setNote] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (contribution) await api.post("/api/v1/goals/" + initial._id + "/contributions", { amount, type, note });
      else if (initial) await api.put("/api/v1/goals/" + initial._id, { name, targetAmount, targetDate });
      else await api.post("/api/v1/goals", { name, targetAmount, targetDate });
      toast.success(contribution ? "Savings updated" : "Goal saved"); onSaved();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  return <form className="form-stack" onSubmit={submit}>{contribution ? <><Field label="Contribution"><select value={type} onChange={(e) => setType(e.target.value)}><option value="deposit">Add savings</option><option value="withdraw">Withdraw savings</option></select></Field><Field label="Amount" type="number" min="0.01" max={type === "withdraw" ? initial.savedAmount : 1000000000} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /><Field label="Note (optional)" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} /><p className="field-hint">Contributions record earmarked savings; your transaction balance stays the same.</p></> : <><Field label="Goal name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} placeholder="Emergency fund" /><Field label="Target amount" type="number" min="0.01" max="1000000000" step="0.01" required value={targetAmount} onChange={(e) => setTarget(e.target.value)} /><Field label="Target date (optional)" type="date" min="2000-01-01" max="2100-12-31" value={targetDate} onChange={(e) => setDate(e.target.value)} /></>}{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="button secondary" onClick={onCancel} disabled={busy}>Cancel</button><button className="button primary" disabled={busy}><LuCheck />{busy ? "Saving..." : contribution ? "Save contribution" : "Save goal"}</button></div></form>;
}
export default function Goals() {
  const resource = useResource("/api/v1/goals"), money = useMoney();
  const [editing, setEditing] = useState(null), [remove, setRemove] = useState(null), [history, setHistory] = useState(null);
  return <><PageHeader eyebrow="MAKE ROOM FOR WHAT MATTERS" title="Savings goals"><button className="button primary" onClick={() => setEditing({ new: true })}><LuPlus />New goal</button></PageHeader><ResourceState resource={resource}>{resource.data?.length ? <div className="item-grid">{resource.data.map((goal) => <article className="goal-item" key={goal._id}><div className="item-heading"><span className="item-symbol blue"><LuTarget /></span><div><h2>{goal.name}</h2><span className="muted">{goal.targetDate ? "Target: " + dateLabel(goal.targetDate) : "No target date"}</span></div><div className="row-actions"><IconButton label={"Edit " + goal.name} onClick={() => setEditing(goal)}><LuPencil /></IconButton><IconButton label={"Delete " + goal.name} onClick={() => setRemove(goal)}><LuTrash2 /></IconButton></div></div><div className="budget-amount"><strong>{money(goal.savedAmount)}</strong><span>of {money(goal.targetAmount)}</span></div><Progress value={goal.percent} label={goal.name + " progress"} tone="blue" /><div className="budget-footer"><span className={"badge " + (goal.percent >= 100 ? "green" : goal.targetDate?.slice(0, 10) < today() ? "amber" : "neutral")}>{goal.percent >= 100 ? "Goal reached" : goal.targetDate?.slice(0, 10) < today() ? "Past target date" : Math.round(goal.percent) + "% saved"}</span><strong>{money(goal.remaining)} to go</strong></div><div className="goal-actions"><button className="button secondary" onClick={() => setEditing({ ...goal, contribution: true })}><LuPlus />Contribution</button><IconButton label={"Contribution history for " + goal.name} onClick={() => setHistory(goal)}><LuHistory /></IconButton></div></article>)}</div> : <EmptyState title="Your next goal starts here" icon={LuTarget}><button className="button secondary" onClick={() => setEditing({ new: true })}><LuPlus />Create a savings goal</button></EmptyState>}</ResourceState>
    <Modal title={editing?.contribution ? editing.name : editing?.new ? "New savings goal" : "Edit savings goal"} isOpen={!!editing} onClose={() => setEditing(null)}><GoalForm initial={editing?.new ? null : editing} contribution={editing?.contribution} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); void resource.refresh(); }} /></Modal>
    <Modal title={"Contributions / " + (history?.name || "")} isOpen={!!history} onClose={() => setHistory(null)}>{history?.contributions.length ? <div className="history-list">{[...history.contributions].reverse().map((entry) => <div key={entry._id}><div><strong>{entry.note || (entry.amount > 0 ? "Deposit" : "Withdrawal")}</strong><span>{dateLabel(entry.date)}</span></div><strong className={entry.amount > 0 ? "income" : "expense"}>{entry.amount > 0 ? "+" : ""}{money(entry.amount)}</strong></div>)}<p className="field-hint">Most recent 100 contributions.</p></div> : <EmptyState title="No contributions yet" icon={LuHistory} />}</Modal>
    <ConfirmDelete item={remove} onClose={() => setRemove(null)} title="Delete savings goal?" onDelete={async (item) => { await api.delete("/api/v1/goals/" + item._id); await resource.refresh(); }} />
  </>;
}
