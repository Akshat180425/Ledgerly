import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuPlus, LuDownload, LuPencil, LuTrash2, LuChevronLeft, LuChevronRight, LuArrowDownLeft, LuArrowUpRight, LuArrowRightLeft, LuSlidersHorizontal, LuX } from "react-icons/lu";
import toast from "react-hot-toast";
import useResource from "../../hooks/useResource";
import api, { errorMessage } from "../../utils/axiosInstance";
import { dateLabel, useMoney } from "../../utils/finance";
import { PageHeader, Stat, ResourceState, EmptyState, IconButton, SearchInput, Field } from "../../components/FinanceUI";
import Modal from "../../components/Modal";
import TransactionForm from "../../components/TransactionForm";
import ConfirmDelete from "../../components/ConfirmDelete";
export default function Transactions({ fixedType }) {
  const [search, setSearch] = useSearchParams();
  const [editing, setEditing] = useState(null), [remove, setRemove] = useState(null), [filters, setFilters] = useState(false), [exporting, setExporting] = useState(false);
  const params = Object.fromEntries(search), type = fixedType || params.type || "all";
  const query = JSON.stringify({ ...params, type });
  const [debounced, setDebounced] = useState(query);
  useEffect(() => { const timeout = setTimeout(() => setDebounced(query), 250); return () => clearTimeout(timeout); }, [query]);
  const resource = useResource("/api/v1/transactions", JSON.parse(debounced));
  const categories = useResource("/api/v1/transactions/categories");
  const money = useMoney();
  const setFilter = (name, value) => setSearch((previous) => { const next = new URLSearchParams(previous); if (value) next.set(name, value); else next.delete(name); if (name !== "page") next.delete("page"); return next; }, { replace: true });
  const exportData = async (format) => {
    setExporting(true);
    try {
      const response = await api.get("/api/v1/transactions/export", { params: { ...params, type, format }, responseType: "blob" });
      const url = URL.createObjectURL(response.data), link = document.createElement("a");
      link.href = url; link.download = "ledgerly-transactions." + format;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Export downloaded");
    } catch (err) {
      if (err.response?.data instanceof Blob) { try { toast.error(JSON.parse(await err.response.data.text()).message); } catch { toast.error("Export failed. Please retry."); } }
      else toast.error(errorMessage(err));
    } finally { setExporting(false); }
  };
  const onSaved = () => { setEditing(null); void resource.refresh(); void categories.refresh(); };
  return <>
    <PageHeader eyebrow="MONEY IN, MONEY OUT" title={fixedType === "income" ? "Income" : fixedType === "expense" ? "Expenses" : "Transactions"}><button className="button primary" onClick={() => setEditing({ new: true })}><LuPlus />Add transaction</button></PageHeader>
    <div className="stats-band"><Stat label="Income" value={money(resource.data?.income)} icon={LuArrowDownLeft} tone="green" /><Stat label="Expenses" value={money(resource.data?.expense)} icon={LuArrowUpRight} tone="coral" /><Stat label="Net cash flow" value={money((resource.data?.income || 0) - (resource.data?.expense || 0))} icon={LuArrowRightLeft} detail="Matching current filters" /></div>
    <section className="transaction-section">
      <div className="section-toolbar">
        <div className="segmented">{["all", "income", "expense"].map((value) => <button key={value} type="button" className={type === value ? "selected" : ""} aria-pressed={type === value} disabled={!!fixedType} onClick={() => setFilter("type", value)}>{value === "all" ? "All transactions" : value === "income" ? "Income" : "Expenses"}</button>)}</div>
        <div className="toolbar-actions"><button className={"button secondary " + (filters ? "is-active" : "")} aria-expanded={filters} onClick={() => setFilters(!filters)}><LuSlidersHorizontal />Filters</button><select className="export-select" aria-label="Export transactions" value="" disabled={exporting} onChange={(e) => exportData(e.target.value)}><option value="" disabled>{exporting ? "Exporting..." : "Export"}</option><option value="csv">CSV</option><option value="xlsx">Excel (.xlsx)</option></select><LuDownload className="export-icon" aria-hidden="true" /></div>
      </div>
      <div className="search-sort"><SearchInput value={params.q || ""} onChange={(e) => setFilter("q", e.target.value)} onClear={() => setFilter("q", "")} /><select aria-label="Sort transactions" value={params.sort || "newest"} onChange={(e) => setFilter("sort", e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option></select></div>
      {filters && <div className="filter-grid"><Field label="From" type="date" value={params.start || ""} onChange={(e) => setFilter("start", e.target.value)} /><Field label="To" type="date" value={params.end || ""} onChange={(e) => setFilter("end", e.target.value)} /><Field label="Category or source"><select value={params.category || ""} onChange={(e) => setFilter("category", e.target.value)}><option value="">All categories</option>{(categories.data || []).filter((item) => type === "all" || item.type === type).map((item) => <option key={item.type + item.label} value={item.label}>{item.label}</option>)}</select></Field><Field label="Minimum amount" type="number" min="0" step="0.01" value={params.minAmount || ""} onChange={(e) => setFilter("minAmount", e.target.value)} /><Field label="Maximum amount" type="number" min="0" step="0.01" value={params.maxAmount || ""} onChange={(e) => setFilter("maxAmount", e.target.value)} /><button className="button text-button" onClick={() => setSearch({})}><LuX />Clear filters</button></div>}
      <ResourceState resource={resource}>{resource.data?.items.length ? <>
        <div className="table-scroll"><table className="transactions-table transaction-ledger"><thead><tr><th>Transaction</th><th>Date</th><th>Type</th><th className="amount-cell">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{resource.data.items.map((item) => <tr key={item._id}><td><div className="table-title"><span className={"transaction-icon " + item.type}>{item.type === "income" ? <LuArrowDownLeft /> : <LuArrowUpRight />}</span><div><strong>{item.label}</strong><span className="mobile-transaction-date">{dateLabel(item.date)}</span><span>{item.note || (item.recurringId ? "Recurring" : item.type === "income" ? "Income" : "Expense")}</span></div></div></td><td className="nowrap">{dateLabel(item.date)}</td><td><span className={"badge " + (item.type === "income" ? "green" : "neutral")}>{item.type}</span></td><td className={"amount-cell " + item.type}>{item.type === "income" ? "+" : "-"}{money(item.amount)}</td><td><div className="row-actions"><IconButton label={"Edit " + item.label} onClick={() => setEditing(item)}><LuPencil /></IconButton><IconButton label={"Delete " + item.label} onClick={() => setRemove(item)}><LuTrash2 /></IconButton></div></td></tr>)}</tbody></table></div>
        <div className="pagination"><span>{resource.data.total} transactions</span><div><IconButton label="Previous page" disabled={resource.data.page <= 1} onClick={() => setFilter("page", resource.data.page - 1)}><LuChevronLeft /></IconButton><span>Page {resource.data.page} of {resource.data.pages}</span><IconButton label="Next page" disabled={resource.data.page >= resource.data.pages} onClick={() => setFilter("page", resource.data.page + 1)}><LuChevronRight /></IconButton></div></div>
      </> : <EmptyState title="No matching transactions" icon={LuArrowRightLeft}><button className="button secondary" onClick={() => setEditing({ new: true })}><LuPlus />Add transaction</button></EmptyState>}</ResourceState>
    </section>
    <Modal title={editing?.new ? "Add transaction" : "Edit transaction"} isOpen={!!editing} onClose={() => setEditing(null)}><TransactionForm initial={editing?.new ? null : editing} defaultType={type === "income" ? "income" : "expense"} onSaved={onSaved} onCancel={() => setEditing(null)} /></Modal>
    <ConfirmDelete item={remove} onClose={() => setRemove(null)} onDelete={async (item) => { await api.delete("/api/v1/" + item.type + "/" + item._id); await resource.refresh(); }} title="Delete transaction?" />
  </>;
}
