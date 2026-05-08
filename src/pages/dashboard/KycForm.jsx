import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../auth/api.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { isCloudinaryConfigured, openUploadWidget } from "../../utils/cloudinary.js";
import { CACHE, invalidateCache } from "../../utils/cache.js";

const DOC_KINDS = [
  { value: "RCCM_CERT", label: "Attestation RCCM" },
  { value: "TAX_ID", label: "Attestation NIU / fiscale" },
  { value: "LEGAL_REP_ID", label: "Pièce d'identité du représentant légal" },
  { value: "OAPI_CERT", label: "Certificat OAPI" },
  { value: "OTHER", label: "Autre document" },
];

const ID_TYPES = ["CNI", "Passport", "Permis"];

function StatusPill({ status }) {
  return (
    <span className={`status-pill ${status}`}>
      <span>●</span>
      {status.replace("_", " ")}
    </span>
  );
}


export default function KycForm() {
  const { user } = useAuth();
  const [existing, setExisting] = useState(null);
  const [hasInst, setHasInst] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [legalRepName, setLegalRepName] = useState("");
  const [legalRepRole, setLegalRepRole] = useState("");
  const [legalRepIdType, setLegalRepIdType] = useState("CNI");
  const [legalRepIdNumber, setLegalRepIdNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [inst, k] = await Promise.all([
          api.getMyInstitution().catch(() => null),
          api.getMyKyc().catch(() => null),
        ]);
        if (!alive) return;
        setHasInst(!!inst);
        setExisting(k);
        if (k) {
          setLegalRepName(k.legalRepName || "");
          setLegalRepRole(k.legalRepRole || "");
          setLegalRepIdType(k.legalRepIdType || "CNI");
          setLegalRepIdNumber(k.legalRepIdNumber || "");
          setNotes(k.notes || "");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const [uploading, setUploading] = useState(false);

  /**
   * Opens the official Cloudinary Upload Widget for the given KYC document
   * kind. The widget handles drag-and-drop, camera capture, file picking and
   * progress UI; we only persist the resulting `secure_url`.
   */
  async function onAddDocument(kind) {
    if (!isCloudinaryConfigured()) {
      setError(
        "Stockage de fichiers non configuré. Définissez VITE_CLOUDINARY_CLOUD_NAME et VITE_CLOUDINARY_UPLOAD_PRESET dans frontend/.env.",
      );
      return;
    }
    setError("");
    setUploading(true);
    try {
      const uploaded = await openUploadWidget({
        folder: `aval/kyc/${user.id}/${kind.toLowerCase()}`,
        multiple: false,
        maxFileSize: 5 * 1024 * 1024,
        clientAllowedFormats: ["pdf", "png", "jpg", "jpeg", "webp"],
      });
      if (uploaded.length === 0) return; // user closed without uploading
      const u = uploaded[0];
      const filename = u.format ? `${u.originalFilename}.${u.format}` : u.originalFilename;
      setDocuments((prev) => [
        ...prev,
        {
          kind,
          filename,
          url: u.secureUrl,
          mimeType: u.mimeType,
          size: u.bytes,
        },
      ]);
    } catch (err) {
      setError(`Échec de l'envoi : ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  function removeDoc(idx) {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!hasInst) {
      setError("Complétez d'abord le profil institutionnel.");
      return;
    }
    if (documents.length === 0) {
      setError("Ajoutez au moins un document de vérification.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.submitKyc({
        legalRepName: legalRepName.trim(),
        legalRepRole: legalRepRole.trim(),
        legalRepIdType,
        legalRepIdNumber: legalRepIdNumber.trim(),
        notes: notes.trim() || undefined,
        documents,
      });
      invalidateCache(CACHE.kyc);
      setExisting(result);
      setDocuments([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="empty">Chargement…</div>;

  return (
    <>
      <h1>Vérification KYC</h1>
      <p className="sub">
        Procédure d'authentification de votre institution. Soumettez le représentant légal
        et les pièces officielles ; un administrateur Aval examinera la demande.
      </p>

      {!hasInst ? (
        <div className="alert">
          <b>Profil institutionnel requis.</b>{" "}
          <Link to="/dashboard/institution" className="auth-link strong">
            Compléter d'abord le profil
          </Link>.
        </div>
      ) : null}

      {!isCloudinaryConfigured() ? (
        <div className="alert">
          <b>Stockage de fichiers non configuré.</b>{" "}
          Définissez <code>VITE_CLOUDINARY_CLOUD_NAME</code> et{" "}
          <code>VITE_CLOUDINARY_UPLOAD_PRESET</code> dans <code>frontend/.env</code>,
          puis redémarrez le serveur de développement.
        </div>
      ) : null}

      {existing ? (
        <div className="tile" style={{ marginBottom: 22 }}>
          <h3>Soumission actuelle</h3>
          <p style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusPill status={existing.status} />
            <span>Soumise le {new Date(existing.submittedAt).toLocaleString()}</span>
          </p>
          {existing.status === "rejected" && existing.rejectionReason ? (
            <p style={{ marginTop: 8 }}>
              <b>Raison du rejet :</b> {existing.rejectionReason}
            </p>
          ) : null}
          {existing.status === "pending" ? (
            <p>Votre dossier est en cours d'examen. Vous serez notifié par courriel.</p>
          ) : null}
        </div>
      ) : null}

      {error ? <div className="alert">{error}</div> : null}

      {(!existing || existing.status === "rejected") && (
        <form className="dash-form" onSubmit={onSubmit}>
          <label className="full">
            Nom complet du représentant légal
            <input value={legalRepName} onChange={(e) => setLegalRepName(e.target.value)} required maxLength={160} />
          </label>
          <label>
            Fonction
            <input value={legalRepRole} onChange={(e) => setLegalRepRole(e.target.value)} required maxLength={120} />
          </label>
          <label>
            Type de pièce d'identité
            <select value={legalRepIdType} onChange={(e) => setLegalRepIdType(e.target.value)}>
              {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="full">
            Numéro de pièce
            <input value={legalRepIdNumber} onChange={(e) => setLegalRepIdNumber(e.target.value)} required maxLength={80} />
          </label>
          <label className="full">
            Notes (facultatif)
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
          </label>

          <div className="full">
            <h2 style={{ marginTop: 0 }}>Documents</h2>
            <p style={{ color: "var(--muted)", margin: "0 0 10px", fontSize: 13.5 }}>
              Ajoutez les pièces officielles (PDF ou image, max 5 MB chacune).
            </p>
            <div className="btn-row">
              {DOC_KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={uploading || !isCloudinaryConfigured()}
                  onClick={() => onAddDocument(k.value)}
                >
                  + {k.label}
                </button>
              ))}
              {uploading ? (
                <span style={{ alignSelf: "center", color: "var(--muted)", fontSize: 13 }}>
                  Téléversement en cours…
                </span>
              ) : null}
            </div>
            <div style={{ marginTop: 14 }}>
              {documents.length === 0 ? (
                <div className="empty">Aucun document ajouté.</div>
              ) : (
                <table className="simple">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Fichier</th>
                      <th>Taille</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((d, i) => (
                      <tr key={i}>
                        <td>{DOC_KINDS.find((k) => k.value === d.kind)?.label || d.kind}</td>
                        <td>{d.filename}</td>
                        <td>{(d.size / 1024).toFixed(1)} KB</td>
                        <td>
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeDoc(i)}>
                            Retirer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="btn-row full">
            <button type="submit" className="btn" disabled={submitting || !hasInst || uploading}>
              {submitting ? "Envoi…" : "Soumettre la demande"} <span>→</span>
            </button>
          </div>
        </form>
      )}
    </>
  );
}
