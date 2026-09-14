import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { errorMessage } from "../utils/axiosInstance";
export default function ConfirmDelete({ item, onClose, onDelete, title = "Delete this record?" }) {
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    setBusy(true);
    try { await onDelete(item); onClose(); toast.success("Record deleted"); }
    catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(false); }
  };
  return <Modal title={title} isOpen={!!item} onClose={() => !busy && onClose()}><p className="muted">This permanently removes {item?.label || item?.name || item?.category || "this record"}.</p><div className="form-actions"><button className="button secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="button danger" disabled={busy} onClick={remove}>{busy ? "Deleting..." : "Delete"}</button></div></Modal>;
}
