import { useEffect } from "react";
import "./ConfirmModal.css";

export default function ConfirmModal({ open, title = "Potvrda", message, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") onConfirm?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="cm-backdrop" onClick={onCancel} aria-modal="true" role="dialog">
      <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="cm-title">{title}</h3>
        <p className="cm-message">{message}</p>
        <div className="cm-actions">
          <button className="cm-btn cm-cancel" onClick={onCancel}>Odustani</button>
          <button className="cm-btn cm-danger" onClick={onConfirm}>Odjavi me</button>
        </div>
      </div>
    </div>
  );
}
