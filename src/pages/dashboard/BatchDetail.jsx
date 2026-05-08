import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../auth/api.js";

function StatusPill({ status }) {
  return (
    <span className={`status-pill ${status}`}>
      <span>●</span>
      {status}
    </span>
  );
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BatchDetail() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null); // "csv" | "pdf" | null
  const [generating, setGenerating] = useState(false);
  const [confirmGen, setConfirmGen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const b = await api.getBatch(id);
        if (alive) setBatch(b);
      } catch (err) {
        if (alive) setError(err.message);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  async function reload() {
    try { setBatch(await api.getBatch(id)); }
    catch (err) { setError(err.message); }
  }

  async function onDownloadCsv() {
    setDownloading("csv");
    setError("");
    try {
      await api.downloadBatchCsv(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  }

  async function onDownloadPdf() {
    setDownloading("pdf");
    setError("");
    try {
      // Lazy-load the PDF renderer (~1.5 MB) only when the user actually
      // requests a PDF — keeps the initial bundle slim for everyone else.
      const [{ buildBatchPdfBlob }, data] = await Promise.all([
        import("../../pdf/BatchPdf.jsx"),
        api.getBatchExport(id),
      ]);
      const blob = await buildBatchPdfBlob({
        batch: data.batch,
        sku: data.sku,
        institution: data.institution,
        codes: data.codes,
        generatedAt: data.batch.generatedAt,
      });
      triggerBlobDownload(blob, `${data.batch.code}-codes.pdf`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  }

  async function onGenerate() {
    setGenerating(true);
    setError("");
    try {
      // Generate persists hashed codes server-side; the cleartext serials
      // come back here exactly once. We trigger the CSV download so the
      // operator never loses them. PDF can be re-built later from /export.json.
      await api.generateBatch(id);
      setConfirmGen(false);
      const refreshed = await api.getBatch(id);
      setBatch(refreshed);
      // Pull the canonical CSV from the server (uses the cleaned format).
      await api.downloadBatchCsv(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (!batch) {
    return (
      <>
        <h1>Lot</h1>
        {error ? <div className="alert">{error}</div> : <div className="empty">Chargement…</div>}
        <Link to="/dashboard/batches" className="btn btn--ghost">← Retour</Link>
      </>
    );
  }

  return (
    <>
      <Link to="/dashboard/batches" className="auth-link" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Tous les lots
      </Link>
      <h1>{batch.code}</h1>
      <p className="sub" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span>{batch.sku?.name}</span>
        <StatusPill status={batch.status} />
      </p>

      {batch.status === "rejected" && batch.rejectionReason ? (
        <div className="tile" style={{ marginBottom: 22 }}>
          <h3>Motif du rejet</h3>
          <p>{batch.rejectionReason}</p>
          <p style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
            Une demande rejetée ne peut pas être renvoyée — créez une nouvelle demande.
          </p>
        </div>
      ) : null}

      {batch.status === "approved" ? (
        <div className="tile" style={{ marginBottom: 22, borderColor: "var(--ok)" }}>
          {!confirmGen ? (
            <>
              <h3>Lot approuvé — prêt à générer</h3>
              <p>
                Lancez la génération des {batch.requestedQuantity.toLocaleString("fr")} codes signés
                quand votre ligne d'impression est prête. Cette action est <b>définitive</b> :
                le contenu en clair des codes ne sera retourné qu'<b>une seule fois</b> (CSV téléchargé
                automatiquement). La base ne stocke ensuite que les hachages.
              </p>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setConfirmGen(true)}
                >
                  Générer les codes signés <span>→</span>
                </button>
              </div>
              {error ? <div className="alert" style={{ marginTop: 10 }}>{error}</div> : null}
            </>
          ) : (
            <>
              <h3>Confirmer la génération ?</h3>
              <p>
                Vous allez générer <b>{batch.requestedQuantity.toLocaleString("fr")}</b> codes
                cryptographiquement signés pour le lot <span className="id">{batch.code}</span>.
                Le CSV sera téléchargé automatiquement à la fin.
              </p>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setConfirmGen(false)}
                  disabled={generating}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn--ok"
                  onClick={onGenerate}
                  disabled={generating}
                >
                  {generating
                    ? "Génération en cours…"
                    : "Confirmer et générer"}
                </button>
              </div>
              {error ? <div className="alert" style={{ marginTop: 10 }}>{error}</div> : null}
            </>
          )}
        </div>
      ) : null}

      {batch.status === "generated" ? (
        <div className="tile" style={{ marginBottom: 22, borderColor: "var(--ok)" }}>
          <h3>Codes prêts à imprimer</h3>
          <p>
            Téléchargez le fichier compatible avec votre ligne d'étiquetage.
            Les codes peuvent être re-téléchargés à tout moment depuis cette page.
          </p>
          <div className="btn-row">
            <button
              type="button"
              className="btn"
              disabled={downloading !== null}
              onClick={onDownloadPdf}
            >
              {downloading === "pdf" ? "Génération du PDF…" : "Télécharger PDF"} <span>→</span>
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={downloading !== null}
              onClick={onDownloadCsv}
            >
              {downloading === "csv" ? "Préparation…" : "Télécharger CSV"}
            </button>
          </div>
          {error ? <div className="alert" style={{ marginTop: 10 }}>{error}</div> : null}
        </div>
      ) : null}

      <table className="simple">
        <tbody>
          <tr><th>Code du lot</th><td><span className="id">{batch.code}</span></td></tr>
          <tr><th>Référence interne</th><td>{batch.externalRef || "—"}</td></tr>
          <tr><th>SKU</th><td>{batch.sku?.name} <span className="id">({batch.sku?.code})</span></td></tr>
          <tr><th>Quantité demandée</th><td>{batch.requestedQuantity.toLocaleString("fr")}</td></tr>
          <tr><th>Date de production</th><td>{new Date(batch.productionDate).toLocaleDateString()}</td></tr>
          <tr><th>Date d'expiration</th><td>{new Date(batch.expiryDate).toLocaleDateString()}</td></tr>
          <tr><th>Statut</th><td><StatusPill status={batch.status} /></td></tr>
          <tr><th>Soumise le</th><td>{new Date(batch.submittedAt).toLocaleString()}</td></tr>
          {batch.reviewedAt ? (
            <tr><th>Examinée le</th><td>{new Date(batch.reviewedAt).toLocaleString()} {batch.reviewedBy ? `par ${batch.reviewedBy.fullName}` : ""}</td></tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}
