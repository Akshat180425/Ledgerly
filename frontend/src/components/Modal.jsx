import { useEffect, useRef } from "react";
import { LuX } from "react-icons/lu";
export default function Modal({ children, isOpen, onClose, title }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    if (isOpen && !node.open) node.showModal();
    if (!isOpen && node.open) node.close();
  }, [isOpen]);
  return <dialog ref={dialog} className="modal" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === dialog.current) onClose(); }} aria-label={title}>
    <div className="modal-inner"><div className="modal-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" title="Close" onClick={onClose}><LuX /></button></div>{isOpen && <div className="modal-body">{children}</div>}</div>
  </dialog>;
}
