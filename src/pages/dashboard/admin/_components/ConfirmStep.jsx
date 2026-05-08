/**
 * Second-validation panel rendered inside the drawer body.
 * The drawer's primary action buttons should call setPendingAction(...) which
 * causes this panel to render in their place; from here the user must click
 * "Confirmer" to actually run the action, or "Annuler" to abort.
 */
export default function ConfirmStep({
  title,
  description,
  warning,
  danger = false,
  busy = false,
  confirmLabel,
  onCancel,
  onConfirm,
  children, // optional extra inputs (e.g. rejection reason textarea)
}) {
  return (
    <div className={`confirm-step${danger ? " danger" : ""}`}>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {warning ? <div className="alert">{warning}</div> : null}
      {children}
      <div className="btn-row">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onCancel}
          disabled={busy}
        >
          Annuler
        </button>
        <button
          type="button"
          className={`btn ${danger ? "btn--danger" : "btn--ok"}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "…" : confirmLabel || "Confirmer"}
        </button>
      </div>
    </div>
  );
}
