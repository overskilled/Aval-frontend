import { useCallback, useEffect, useState } from "react";
import AdminGate from "./AdminGate.jsx";
import Drawer from "./_components/Drawer.jsx";
import DataTable from "./_components/DataTable.jsx";
import ConfirmStep from "./_components/ConfirmStep.jsx";
import { api } from "../../../auth/api.js";

export default function AdminKyc() {
  return <AdminGate><Inner /></AdminGate>;
}

function Inner() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending");

  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(null); // null | "approve" | "reject"
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setSubmissions(await api.adminListKyc()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function open(row) { setSelected(row); setPending(null); setReason(""); setError(""); }
  function close() { setSelected(null); setPending(null); setReason(""); }

  async function runApprove() {
    setBusy(true); setError("");
    try {
      await api.adminReviewKyc(selected.id, "approved");
      await load(); close();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function runReject() {
    if (!reason.trim()) { setError("Indiquez une raison de rejet."); return; }
    setBusy(true); setError("");
    try {
      await api.adminReviewKyc(selected.id, "rejected", reason.trim());
      await load(); close();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const visible = filter === "all" ? submissions : submissions.filter((s) => s.status === filter);

  const columns = [
    { key: "institution", label: "Institution", render: (s) => s.institution.legalName },
    { key: "user", label: "Demandeur", render: (s) => (
        <>
          <div>{s.user.fullName}</div>
          <div className="id" style={{ fontSize: 11 }}>{s.user.email}</div>
        </>
      ) },
    { key: "status", label: "Statut", render: (s) => <span className={`status-pill ${s.status}`}>{s.status}</span> },
    { key: "documents", label: "Documents", render: (s) => s.documents.length },
    { key: "submittedAt", label: "Soumise", render: (s) => new Date(s.submittedAt).toLocaleString() },
  ];

  return (
    <>
      <h1>Revue KYC</h1>
      <p className="sub">Examiner et valider les soumissions des institutions.</p>

      {error && !selected ? <div className="alert">{error}</div> : null}

      <div className="btn-row" style={{ marginBottom: 14 }}>
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button key={f} type="button"
            className={`btn btn--sm ${filter === f ? "" : "btn--ghost"}`}
            onClick={() => setFilter(f)}>
            {f === "all" ? "Tous" : f}
          </button>
        ))}
      </div>

      {loading ? <div className="empty">Chargement…</div> : (
        <DataTable
          columns={columns}
          rows={visible}
          onRowClick={open}
          emptyText="Aucune soumission dans cette vue."
        />
      )}

      <Drawer
        open={!!selected}
        onClose={close}
        title={selected?.institution.legalName || ""}
        subtitle={selected?.user.email || ""}
        footer={
          selected && !pending ? (
            <>
              <button type="button" className="btn btn--ghost" onClick={close}>Fermer</button>
              {selected.status === "pending" && (
                <>
                  <button type="button" className="btn btn--danger" onClick={() => setPending("reject")}>Rejeter</button>
                  <button type="button" className="btn btn--ok" onClick={() => setPending("approve")}>Approuver</button>
                </>
              )}
            </>
          ) : null
        }
      >
        {selected ? (
          pending === "approve" ? (
            <ConfirmStep
              title="Approuver ce dossier KYC ?"
              description={`Vous êtes sur le point d'approuver ${selected.institution.legalName}. L'institution pourra alors enregistrer des SKUs et demander des lots.`}
              warning={error || undefined}
              busy={busy}
              confirmLabel="Confirmer l'approbation"
              onCancel={() => { setPending(null); setError(""); }}
              onConfirm={runApprove}
            />
          ) : pending === "reject" ? (
            <ConfirmStep
              title="Rejeter ce dossier KYC ?"
              description="L'institution sera notifiée par email. Elle pourra soumettre un nouveau dossier corrigé."
              warning={error || undefined}
              danger busy={busy}
              confirmLabel="Confirmer le rejet"
              onCancel={() => { setPending(null); setReason(""); setError(""); }}
              onConfirm={runReject}
            >
              <label style={{ display: "block", marginTop: 6 }}>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, letterSpacing: "0.12em", color: "var(--muted)", textTransform: "uppercase" }}>
                  Raison du rejet
                </span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  style={{ width: "100%", marginTop: 6 }}
                  required
                />
              </label>
            </ConfirmStep>
          ) : (
            <KycDetail submission={selected} />
          )
        ) : null}
      </Drawer>
    </>
  );
}

function DocLink({ doc }) {
  return (
    <li style={{ marginBottom: 6 }}>
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="auth-link strong"
      >
        {doc.kind} — {doc.filename}
      </a>{" "}
      <span style={{ color: "var(--muted)", fontSize: 12 }}>({(doc.size / 1024).toFixed(1)} KB)</span>
    </li>
  );
}

function KycDetail({ submission }) {
  return (
    <>
      <table className="simple">
        <tbody>
          <tr><th>Représentant légal</th><td>{submission.legalRepName}</td></tr>
          <tr><th>Fonction</th><td>{submission.legalRepRole}</td></tr>
          <tr><th>Pièce</th><td>{submission.legalRepIdType} — {submission.legalRepIdNumber}</td></tr>
          <tr><th>Notes</th><td>{submission.notes || "—"}</td></tr>
          <tr><th>RCCM</th><td>{submission.institution.rccm || "—"}</td></tr>
          <tr><th>NIU</th><td>{submission.institution.taxId || "—"}</td></tr>
          <tr><th>OAPI</th><td>{submission.institution.oapiId || "—"}</td></tr>
          <tr><th>Secteur</th><td>{submission.institution.sector}</td></tr>
          <tr><th>Statut</th><td><span className={`status-pill ${submission.status}`}>{submission.status}</span></td></tr>
          {submission.rejectionReason ? <tr><th>Raison du rejet</th><td>{submission.rejectionReason}</td></tr> : null}
        </tbody>
      </table>

      <h3 style={{ marginTop: 18 }}>Documents</h3>
      {submission.documents.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Aucun document.</p>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {submission.documents.map((d) => (
            <DocLink key={d.id} doc={d} />
          ))}
        </ul>
      )}
    </>
  );
}
