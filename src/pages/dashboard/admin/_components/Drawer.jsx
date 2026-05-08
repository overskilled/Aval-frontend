import { useEffect } from "react";

/**
 * Right-to-left slide-in drawer for admin detail views.
 * - Action buttons live ONLY in the footer (per UX policy).
 * - Closes on Escape or overlay click.
 * - Locks body scroll while open.
 */
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 560,
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`admin-drawer-overlay${open ? " is-open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`admin-drawer${open ? " is-open" : ""}`}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label={title}
      >
        <header className="admin-drawer-header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer le panneau">
            ✕
          </button>
        </header>
        <div className="admin-drawer-body">{children}</div>
        {footer ? <footer className="admin-drawer-footer">{footer}</footer> : null}
      </aside>
    </>
  );
}
