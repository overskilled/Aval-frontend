import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../auth/api.js";

const CATEGORIES = {
  bottled_water: "Eau en bouteille",
  soft_drinks: "Boissons gazeuses",
};

const PACKAGING = {
  PET: "PET (plastique)",
  glass: "Verre",
  aluminum: "Aluminium",
  carton: "Carton",
  other: "Autre",
};

function StatusPill({ status }) {
  return (
    <span className={`status-pill ${status}`}>
      <span>●</span>
      {status}
    </span>
  );
}

export default function SkuDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sku, setSku] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // edit fields
  const [name, setName] = useState("");
  const [volume, setVolume] = useState(0);
  const [batchFormat, setBatchFormat] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const s = await api.getSku(id);
      setSku(s);
      setName(s.name);
      setVolume(s.declaredVolumeMl);
      setBatchFormat(s.batchFormat);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.updateSku(id, {
        name: name.trim(),
        declaredVolumeMl: Number(volume),
        batchFormat: batchFormat.trim(),
      });
      setEditing(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onWithdraw() {
    if (!confirm("Retirer cette référence ? Cette action est irréversible.")) return;
    try {
      await api.withdrawSku(id);
      navigate("/dashboard/skus", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  if (!sku) {
    return (
      <>
        <h1>Référence</h1>
        {error ? <div className="alert">{error}</div> : <div className="empty">Chargement…</div>}
        <Link to="/dashboard/skus" className="btn btn--ghost">← Retour</Link>
      </>
    );
  }

  const isPending = sku.status === "pending";

  return (
    <>
      <Link to="/dashboard/skus" className="auth-link" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Toutes les références
      </Link>
      <h1>{sku.name}</h1>
      <p className="sub" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="id">{sku.code}</span>
        <StatusPill status={sku.status} />
      </p>

      {error ? <div className="alert">{error}</div> : null}

      {sku.status === "rejected" && sku.rejectionReason ? (
        <div className="tile" style={{ marginBottom: 22 }}>
          <h3>Motif du rejet</h3>
          <p>{sku.rejectionReason}</p>
          {sku.reviewedBy ? (
            <p style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
              Examiné par {sku.reviewedBy.fullName} · {new Date(sku.reviewedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}

      {sku.status === "approved" ? (
        <div className="tile" style={{ marginBottom: 22, borderColor: "var(--ok)" }}>
          <h3>Référence approuvée</h3>
          <p>Vous pouvez maintenant demander des lots de codes pour ce produit. (À venir : bouton « Demander un lot ».)</p>
          {sku.reviewedBy ? (
            <p style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
              Approuvé par {sku.reviewedBy.fullName} · {new Date(sku.reviewedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}

      {editing ? (
        <form className="dash-form" onSubmit={onSave}>
          <label className="full">
            Nom commercial
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={160} />
          </label>
          <label>
            Volume déclaré (mL)
            <input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} min={50} max={20000} required />
          </label>
          <label>
            Format de lot
            <input value={batchFormat} onChange={(e) => setBatchFormat(e.target.value)} required maxLength={80} />
          </label>
          <div className="btn-row full">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"} <span>→</span>
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>Annuler</button>
          </div>
        </form>
      ) : (
        <table className="simple">
          <tbody>
            <tr><th>Code</th><td><span className="id">{sku.code}</span></td></tr>
            <tr><th>Nom</th><td>{sku.name}</td></tr>
            <tr><th>Catégorie</th><td>{CATEGORIES[sku.category] || sku.category}</td></tr>
            <tr><th>Conditionnement</th><td>{PACKAGING[sku.packaging] || sku.packaging}</td></tr>
            <tr><th>Volume déclaré</th><td>{sku.declaredVolumeMl} mL</td></tr>
            <tr><th>Format de lot</th><td><span className="id">{sku.batchFormat}</span></td></tr>
            <tr><th>Soumise le</th><td>{new Date(sku.submittedAt).toLocaleString()}</td></tr>
          </tbody>
        </table>
      )}

      {isPending && !editing ? (
        <div className="btn-row" style={{ marginTop: 20 }}>
          <button type="button" className="btn" onClick={() => setEditing(true)}>Modifier</button>
          <button type="button" className="btn btn--danger" onClick={onWithdraw}>Retirer</button>
        </div>
      ) : null}
    </>
  );
}
