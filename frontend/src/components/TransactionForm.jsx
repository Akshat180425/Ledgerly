import { useState } from "react";
import toast from "react-hot-toast";
import { LuCheck } from "react-icons/lu";
import { Field } from "./FinanceUI";
import { today, expenseCategories, incomeSources } from "../utils/finance";
import api, { errorMessage } from "../utils/axiosInstance";
export default function TransactionForm({ initial, defaultType = "expense", onSaved, onCancel }) {
  const [type, setType] = useState(initial?.type || defaultType);
  const [label, setLabel] = useState(initial?.label || initial?.source || initial?.category || "");
  const [amount, setAmount] = useState(initial?.amount || ""), [date, setDate] = useState(initial?.date?.slice(0, 10) || today()), [note, setNote] = useState(initial?.note || "");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const data = { label, amount, date, note, icon: initial?.icon || "" };
      const response = initial ? await api.put("/api/v1/" + type + "/" + initial._id, data) : await api.post("/api/v1/" + type + "/add", data);
      toast.success(initial ? "Transaction updated" : "Transaction added");
      for (const warning of response.data.warnings || []) toast(warning.category + " budget: " + Math.round(warning.percent) + "% used", { duration: 6000 });
      onSaved();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  return <form className="form-stack" onSubmit={submit}><div className="segmented" aria-label="Transaction type">{["expense", "income"].map((value) => <button key={value} type="button" aria-pressed={type === value} disabled={!!initial} className={type === value ? "selected" : ""} onClick={() => { setType(value); setLabel(""); }}>{value === "income" ? "Income" : "Expense"}</button>)}</div>
    <Field label={type === "income" ? "Source" : "Category"} value={label} onChange={(e) => setLabel(e.target.value)} required maxLength={100} list="transaction-labels" placeholder={type === "income" ? "Salary" : "Groceries"} />
    <datalist id="transaction-labels">{(type === "income" ? incomeSources : expenseCategories).map((item) => <option key={item} value={item} />)}</datalist>
    <div className="form-grid"><Field label="Amount" type="number" min="0.01" max="1000000000" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required /><Field label="Date" type="date" min="2000-01-01" max={today()} value={date} onChange={(e) => setDate(e.target.value)} required /></div>
    <Field label="Note (optional)"><textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button type="button" className="button secondary" disabled={busy} onClick={onCancel}>Cancel</button><button className="button primary" disabled={busy}><LuCheck />{busy ? "Saving..." : "Save transaction"}</button></div>
  </form>;
}
