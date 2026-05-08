import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../auth/api.js";
import { useAuth } from "../../auth/AuthContext.jsx";

const CATEGORIES = [
  { value: "bottled_water", label: "Eau en bouteille" },
  { value: "soft_drinks", label: "Boissons gazeuses" },
];

const PACKAGING = [
  { value: "PET", label: "PET (plastique)" },
  { value: "glass", label: "Verre" },
  { value: "aluminum", label: "Aluminium" },
  { value: "carton", label: "Carton" },
  { value: "other", label: "Autre" },
];

function StatusPill({ status }) {
  return (
    <span className={`status-pill ${status}`}>
      <span>●</span>
      {status}
    </span>
  );
}

export default function Skus() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("bottled_water");
  const [packaging, setPackaging] = useState("PET");
  const [volume, setVolume] = useState(1500);
  const [batchFormat, setBatchFormat] = useState("AVL-{YYMM}-{SEQ}");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setList(await api.listSkus());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.createSku({
        name: name.trim(),
        category,
        packaging,
        declaredVolumeMl: Number(volume),
        batchFormat: batchFormat.trim(),
      });
      setName("");
      setVolume(1500);
      setBatchFormat("AVL-{YYMM}-{SEQ}");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  const kycApproved = user.kycStatus === "approved";

  return (
    <>
      <h1>SKUs (références produit)</h1>
      <p className="sub">
        Enregistrez chaque référence produit (eau ou boisson gazeuse) que vous
        souhaitez authentifier. Chaque SKU est revue par le régulateur avant de
        devenir éligible à l'émission de codes.
      </p>

      {!kycApproved ? (
        <div className="alert">
          <b>KYC requis.</b> Votre institution doit être vérifiée avant de pouvoir
          enregistrer des SKUs.{" "}
          <Link to="/dashboard/kyc" className="auth-link strong">
            Voir mon dossier KYC
          </Link>
        </div>
      ) : null}

      {error ? <div className="alert">{error}</div> : null}

      {kycApproved && (
        <>
          <h2>Nouvelle référence</h2>
          <form className="dash-form" onSubmit={onCreate}>
            <label className="full">
              Nom commercial du produit
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={160}
                placeholder="Source du Pays — Eau minérale 1,5 L"
              />
            </label>
            <label>
              Catégorie
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label>
              Conditionnement
              <select value={packaging} onChange={(e) => setPackaging(e.target.value)}>
                {PACKAGING.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label>
              Volume déclaré (mL)
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                min={50}
                max={20000}
                required
              />
            </label>
            <label>
              Format de lot
              <input
                value={batchFormat}
                onChange={(e) => setBatchFormat(e.target.value)}
                maxLength={80}
                required
                placeholder="AVL-{YYMM}-{SEQ}"
              />
            </label>
            <div className="btn-row full">
              <button type="submit" className="btn" disabled={creating}>
                {creating ? "Soumission…" : "Soumettre pour approbation"} <span>→</span>
              </button>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                Après soumission, la référence est <b>en attente</b> jusqu'à validation par le régulateur.
              </span>
            </div>
          </form>
        </>
      )}

      <h2>Vos références</h2>
      {loading ? (
        <div className="empty">Chargement…</div>
      ) : list.length === 0 ? (
        <div className="empty">Aucune référence enregistrée.</div>
      ) : (
        <table className="simple">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Volume</th>
              <th>Statut</th>
              <th>Soumise</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td><span className="id">{s.code}</span></td>
                <td>{s.name}</td>
                <td>{CATEGORIES.find((c) => c.value === s.category)?.label || s.category}</td>
                <td>{s.declaredVolumeMl} mL</td>
                <td><StatusPill status={s.status} /></td>
                <td>{new Date(s.submittedAt).toLocaleDateString()}</td>
                <td>
                  <Link to={`/dashboard/skus/${s.id}`} className="btn btn--ghost btn--sm">
                    Détails
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
