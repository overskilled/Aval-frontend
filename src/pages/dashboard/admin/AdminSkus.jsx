import { useCallback, useEffect, useState } from "react";
import AdminGate from "./AdminGate.jsx";
import Drawer from "./_components/Drawer.jsx";
import DataTable from "./_components/DataTable.jsx";
import ConfirmStep from "./_components/ConfirmStep.jsx";
import { api } from "../../../auth/api.js";

const CATEGORIES = {
  bottled_water: "Eau",
  soft_drinks: "Boissons gazeuses",
};

export default function AdminSkus() {
  return <AdminGate><Inner /></AdminGate>;
}

function Inner() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending");

  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(null); // null | "approve" | "reject"
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setList(await api.adminListSkus()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function open(row) {
    setSelected(row); setPending(null); setReason(""); setError("");
  }
  function close() {
    setSelected(null); setPending(null); setReason("");
  }

  async function runApprove() {
    setBusy(true); setError("");
    try {
      await api.adminReviewSku(selected.id, "approved");
      await load(); close();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function runReject() {
    if (!reason.trim()) { setError("Indiquez une raison de rejet."); return; }
    setBusy(true); setError("");
    try {
      await api.adminReviewSku(selected.id, "rejected", reason.trim());
      await load(); close();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const visible = filter === "all" ? list : list.filter((s) => s.status === filter);

  const columns = [
    { key: "code", label: "Code", render: (r) => <span className="id">{r.code}</span> },
    { key: "name", label: "Nom" },
    { key: "institution", label: "Industriel", render: (r) => (
        <>
          <div>{r.institution.legalName}</div>
          <div className="id" style={{ fontSize: 11 }}>{r.owner.email}</div>
        </>
      ) },
    { key: "category", label: "Catégorie", render: (r) => CATEGORIES[r.category] || r.category },
    { key: "volume", label: "Volume", render: (r) => `${r.declaredVolumeMl} mL` },
    { key: "status", label: "Statut", render: (r) => <span className={`status-pill ${r.status}`}>{r.status}</span> },
    { key: "submittedAt", label: "Soumise", render: (r) => new Date(r.submittedAt).toLocaleDateString() },
  ];

  return (
    <>
      <h1>Revue des SKUs</h1>
      <p className="sub">Examiner et approuver/rejeter les références produit soumises par les industriels.</p>

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
          emptyText="Aucune référence dans cette vue."
        />
      )}

      <Drawer
        open={!!selected}
        onClose={close}
        title={selected?.name || ""}
        subtitle={selected?.code || ""}
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
              title="Approuver ce SKU ?"
              description={`Vous êtes sur le point d'approuver "${selected.name}" (${selected.code}). L'industriel pourra ensuite demander des lots de codes pour cette référence.`}
              warning={error || undefined}
              busy={busy}
              confirmLabel="Confirmer l'approbation"
              onCancel={() => { setPending(null); setError(""); }}
              onConfirm={runApprove}
            />
          ) : pending === "reject" ? (
            <ConfirmStep
              title="Rejeter ce SKU ?"
              description="L'industriel sera notifié par email avec la raison ci-dessous. Il pourra soumettre un nouveau SKU corrigé."
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
            <SkuDetail sku={selected} />
          )
        ) : null}
      </Drawer>
    </>
  );
}

function SkuDetail({ sku }) {
  return (
    <table className="simple">
      <tbody>
        <tr><th>Code</th><td><span className="id">{sku.code}</span></td></tr>
        <tr><th>Industriel</th><td>{sku.institution.legalName}</td></tr>
        <tr><th>Représentant</th><td>{sku.owner.fullName} ({sku.owner.email})</td></tr>
        <tr><th>RCCM</th><td>{sku.institution.rccm || "—"}</td></tr>
        <tr><th>NIU</th><td>{sku.institution.taxId || "—"}</td></tr>
        <tr><th>OAPI</th><td>{sku.institution.oapiId || "—"}</td></tr>
        <tr><th>Catégorie</th><td>{CATEGORIES[sku.category] || sku.category}</td></tr>
        <tr><th>Conditionnement</th><td>{sku.packaging}</td></tr>
        <tr><th>Volume déclaré</th><td>{sku.declaredVolumeMl} mL</td></tr>
        <tr><th>Format de lot</th><td><span className="id">{sku.batchFormat}</span></td></tr>
        <tr><th>Statut</th><td><span className={`status-pill ${sku.status}`}>{sku.status}</span></td></tr>
        {sku.rejectionReason ? <tr><th>Raison du rejet</th><td>{sku.rejectionReason}</td></tr> : null}
        {sku.reviewedAt ? <tr><th>Examiné le</th><td>{new Date(sku.reviewedAt).toLocaleString()}</td></tr> : null}
      </tbody>
    </table>
  );
}
