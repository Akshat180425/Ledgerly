import { LuArrowDownLeft, LuArrowUpRight, LuLoaderCircle, LuRefreshCw, LuSearch, LuX } from "react-icons/lu";
import { dateLabel, useMoney } from "../utils/finance";
export function IconButton({ label, children, ...props }) { return <button type="button" className="icon-button" title={label} aria-label={label} {...props}>{children}</button>; }
export function Field({ label, children, className = "", ...props }) { return <label className={"field " + className}><span>{label}</span>{children || <input {...props} />}</label>; }
export function PageHeader({ title, eyebrow, children }) { return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1></div><div className="heading-actions">{children}</div></div>; }
export function Loading() { return <div className="loading-state" role="status"><LuLoaderCircle className="spin" /> Loading your finances...</div>; }
export function ErrorState({ message, retry }) { return <div className="error-state" role="alert"><p>{message}</p><button className="button secondary" onClick={retry}><LuRefreshCw /> Retry</button></div>; }
export function ResourceState({ resource, children }) {
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorState message={resource.error} retry={resource.refresh} />;
  return children;
}
export function EmptyState({ icon: Icon = LuSearch, title, children }) { return <div className="empty-state"><Icon /><h3>{title}</h3>{children}</div>; }
export function Progress({ value, label, tone = "green" }) { return <div className={"progress-track " + tone} role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={Math.max(100, Math.round(value))}><span style={{ width: Math.min(100, Math.max(0, value)) + "%" }} /></div>; }
export function Stat({ label, value, icon: Icon, tone = "", detail }) { return <div className={"stat " + tone}><div className="stat-label">{label}{Icon && <Icon />}</div><strong title={String(value)}>{value}</strong>{detail && <span className="stat-detail">{detail}</span>}</div>; }
export function TransactionRow({ item, children }) {
  const money = useMoney();
  return <div className="transaction-row"><span className={"transaction-icon " + item.type}>{item.type === "income" ? <LuArrowDownLeft /> : <LuArrowUpRight />}</span><div className="transaction-title"><strong>{item.label || item.source || item.category}</strong><span>{dateLabel(item.date)}{item.recurringId ? " / Recurring" : ""}</span></div><strong className={"transaction-amount " + item.type}>{item.type === "income" ? "+" : "-"}{money(item.amount)}</strong>{children}</div>;
}
export function SearchInput({ value, onChange, placeholder = "Search transactions", onClear }) { return <div className="search-input"><LuSearch /><input aria-label={placeholder} placeholder={placeholder} value={value} onChange={onChange} />{value && <IconButton label="Clear search" onClick={onClear}><LuX /></IconButton>}</div>; }
