import { useCallback, useEffect, useState } from "react";
import AdminGate from "./AdminGate.jsx";
import Drawer from "./_components/Drawer.jsx";
import DataTable from "./_components/DataTable.jsx";
import ConfirmStep from "./_components/ConfirmStep.jsx";
import { api } from "../../../auth/api.js";

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminBatches() {
  return <AdminGate><Inner /></AdminGate>;
}

function Inner() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending");

  // Drawer state
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(null); // null | "approve" | "reject"
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setList(await api.adminListBatches()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openDrawer(row) {
    setSelected(row);
    setPending(null);
    setReason("");
    setError("");
  }
  function closeDrawer() {
    setSelected(null);
    setPending(null);
    setReason("");
  }

  async function runApprove() {
    setBusy(true); setError("");
    try {
      await api.adminReviewBatch(selected.id, "approved");
      await load();
      closeDrawer();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function runReject() {
    if (!reason.trim()) { setError("Indiquez une raison de rejet."); return; }
    setBusy(true); setError("");
    try {
      await api.adminReviewBatch(selected.id, "rejected", reason.trim());
      await load();
      closeDrawer();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function downloadCsv() {
    try { await api.adminDownloadBatchCsv(selected.id); }
    catch (e) { setError(e.message); }
  }
  async function downloadPdf() {
    try {
      const [{ buildBatchPdfBlob }, data] = await Promise.all([
        import("../../../pdf/BatchPdf.jsx"),
        api.adminGetBatchExport(selected.id),
      ]);
      const blob = await buildBatchPdfBlob({
        batch: data.batch,
        sku: data.sku,
        institution: data.institution,
        codes: data.codes,
        generatedAt: data.batch.generatedAt,
      });
      triggerBlobDownload(blob, `${data.batch.code}-codes.pdf`);
    } catch (e) {
      setError(e.message);
    }
  }

  const visible = filter === "all" ? list : list.filter((b) => b.status === filter);

  const columns = [
    { key: "code", label: "Code", render: (r) => <span className="id">{r.code}</span> },
    { key: "institution", label: "Industriel", render: (r) => (
        <>
          <div>{r.institution.legalName}</div>
          <div className="id" style={{ fontSize: 11 }}>{r.owner.email}</div>
        </>
      )
    },
    { key: "sku", label: "SKU", render: (r) => (
        <>
          <div>{r.sku.name}</div>
          <div className="id" style={{ fontSize: 11 }}>{r.sku.code}</div>
        </>
      )
    },
    { key: "qty", label: "Quantité", render: (r) => r.requestedQuantity.toLocaleString("fr") },
    { key: "status", label: "Statut", render: (r) => <span className={`status-pill ${r.status}`}>{r.status}</span> },
    { key: "submittedAt", label: "Soumise", render: (r) => new Date(r.submittedAt).toLocaleDateString() },
  ];

  return (
    <>
      <h1>Revue des lots</h1>
      <p className="sub">
        Approuver ou rejeter les demandes de lots. Une fois approuvé, l'industriel
        déclenche lui-même la génération des codes signés depuis son tableau de bord.
      </p>

      {error && !selected ? <div className="alert">{error}</div> : null}

      <div className="btn-row" style={{ marginBottom: 14 }}>
        {["pending", "approved", "rejected", "generated", "revoked", "all"].map((f) => (
          <button
            key={f} type="button"
            className={`btn btn--sm ${filter === f ? "" : "btn--ghost"}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Tous" : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty">Chargement…</div>
      ) : (
        <DataTable
          columns={columns}
          rows={visible}
          onRowClick={openDrawer}
          emptyText="Aucune demande dans cette vue."
        />
      )}

      <Drawer
        open={!!selected}
        onClose={closeDrawer}
        title={selected?.code || ""}
        subtitle={selected ? `${selected.sku?.name} · ${selected.institution?.legalName}` : ""}
        footer={
          selected && !pending ? (
            <BatchActionsFooter
              status={selected.status}
              onApprove={() => setPending("approve")}
              onReject={() => setPending("reject")}
              onDownloadCsv={downloadCsv}
              onDownloadPdf={downloadPdf}
              onClose={closeDrawer}
            />
          ) : null
        }
      >
        {selected ? (
          pending === "approve" ? (
            <ConfirmStep
              title="Approuver ce lot ?"
              description={`Vous êtes sur le point d'approuver le lot ${selected.code} (${selected.requestedQuantity.toLocaleString("fr")} codes). L'industriel sera notifié et pourra générer les codes signés depuis son tableau de bord.`}
              warning={error || undefined}
              busy={busy}
              confirmLabel="Confirmer l'approbation"
              onCancel={() => { setPending(null); setError(""); }}
              onConfirm={runApprove}
            />
          ) : pending === "reject" ? (
            <ConfirmStep
              title="Rejeter ce lot ?"
              description="Une demande rejetée ne peut pas être renvoyée — l'industriel devra créer une nouvelle demande corrigée. Indiquez une raison claire."
              warning={error || undefined}
              danger
              busy={busy}
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
            <BatchDetail batch={selected} error={error} />
          )
        ) : null}
      </Drawer>
    </>
  );
}

function BatchActionsFooter({ status, onApprove, onReject, onDownloadCsv, onDownloadPdf, onClose }) {
  return (
    <>
      <button type="button" className="btn btn--ghost" onClick={onClose}>Fermer</button>
      {status === "pending" && (
        <>
          <button type="button" className="btn btn--danger" onClick={onReject}>Rejeter</button>
          <button type="button" className="btn btn--ok" onClick={onApprove}>Approuver</button>
        </>
      )}
      {status === "generated" && (
        <>
          <button type="button" className="btn btn--ghost" onClick={onDownloadCsv}>Télécharger CSV</button>
          <button type="button" className="btn" onClick={onDownloadPdf}>Télécharger PDF</button>
        </>
      )}
    </>
  );
}

function BatchDetail({ batch, error }) {
  return (
    <>
      {error ? <div className="alert">{error}</div> : null}
      <table className="simple">
        <tbody>
          <tr><th>Industriel</th><td>{batch.institution.legalName}</td></tr>
          <tr><th>Représentant</th><td>{batch.owner.fullName} ({batch.owner.email})</td></tr>
          <tr><th>SKU</th><td>{batch.sku.name} <span className="id">({batch.sku.code})</span></td></tr>
          <tr><th>Catégorie</th><td>{batch.sku.category}</td></tr>
          <tr><th>Volume</th><td>{batch.sku.declaredVolumeMl} mL</td></tr>
          <tr><th>Quantité demandée</th><td>{batch.requestedQuantity.toLocaleString("fr")}</td></tr>
          <tr><th>Référence interne</th><td>{batch.externalRef || "—"}</td></tr>
          <tr><th>Production</th><td>{new Date(batch.productionDate).toLocaleDateString()}</td></tr>
          <tr><th>Expiration</th><td>{new Date(batch.expiryDate).toLocaleDateString()}</td></tr>
          <tr><th>Statut</th><td><span className={`status-pill ${batch.status}`}>{batch.status}</span></td></tr>
          {batch.rejectionReason ? (
            <tr><th>Raison du rejet</th><td>{batch.rejectionReason}</td></tr>
          ) : null}
          {batch.generatedAt ? (
            <tr><th>Généré le</th><td>{new Date(batch.generatedAt).toLocaleString()}</td></tr>
          ) : null}
        </tbody>
      </table>
      {batch.status === "approved" ? (
        <p style={{ marginTop: 14, color: "var(--muted)", fontSize: 13 }}>
          En attente que l'industriel déclenche la génération depuis son tableau de bord.
        </p>
      ) : null}
    </>
  );
}
