import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../auth/api.js";

const MIN_QTY = 100;
const MAX_QTY = 100_000;

function StatusPill({ status }) {
  return (
    <span className={`status-pill ${status}`}>
      <span>●</span>
      {status}
    </span>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusYearsIso(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export default function Batches() {
  const [skus, setSkus] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // form state
  const [skuId, setSkuId] = useState("");
  const [quantity, setQuantity] = useState(10_000);
  const [productionDate, setProductionDate] = useState(todayIso());
  const [expiryDate, setExpiryDate] = useState(plusYearsIso(1));
  const [externalRef, setExternalRef] = useState("");

  const approvedSkus = useMemo(() => skus.filter((s) => s.status === "approved"), [skus]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [s, b] = await Promise.all([api.listSkus(), api.listBatches()]);
      setSkus(s);
      setBatches(b);
      if (!skuId && s.find((x) => x.status === "approved")) {
        setSkuId(s.find((x) => x.status === "approved").id);
      }
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
      await api.createBatch({
        skuId,
        requestedQuantity: Number(quantity),
        productionDate,
        expiryDate,
        externalRef: externalRef.trim() || undefined,
      });
      setExternalRef("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <h1>Lots de codes</h1>
      <p className="sub">
        Demandez un lot de codes pour une référence approuvée. Chaque demande
        est revue par le régulateur avant que les codes soient générés.
      </p>

      {error ? <div className="alert">{error}</div> : null}

      {approvedSkus.length === 0 ? (
        <div className="alert">
          Vous n'avez aucune référence approuvée pour le moment.{" "}
          <Link to="/dashboard/skus" className="auth-link strong">
            Gérer mes références
          </Link>
        </div>
      ) : (
        <>
          <h2>Nouvelle demande</h2>
          <form className="dash-form" onSubmit={onCreate}>
            <label className="full">
              Référence (SKU)
              <select value={skuId} onChange={(e) => setSkuId(e.target.value)} required>
                {approvedSkus.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.code} ({s.declaredVolumeMl} mL)
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantité demandée ({MIN_QTY.toLocaleString("fr")} – {MAX_QTY.toLocaleString("fr")})
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min={MIN_QTY}
                max={MAX_QTY}
                required
              />
            </label>
            <label>
              Référence interne (optionnelle)
              <input
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                maxLength={80}
                placeholder="LOT-2026-MAR-01"
              />
            </label>
            <label>
              Date de production
              <input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                required
              />
            </label>
            <label>
              Date d'expiration
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </label>
            <div className="btn-row full">
              <button type="submit" className="btn" disabled={creating || !skuId}>
                {creating ? "Soumission…" : "Soumettre la demande"} <span>→</span>
              </button>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                Une fois soumise, la demande est <b>en lecture seule</b> jusqu'à décision du régulateur.
              </span>
            </div>
          </form>
        </>
      )}

      <h2>Vos demandes de lots</h2>
      {loading ? (
        <div className="empty">Chargement…</div>
      ) : batches.length === 0 ? (
        <div className="empty">Aucune demande de lot.</div>
      ) : (
        <table className="simple">
          <thead>
            <tr>
              <th>Code</th>
              <th>Référence</th>
              <th>Quantité</th>
              <th>Production</th>
              <th>Expiration</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td><span className="id">{b.code}</span></td>
                <td>{b.sku?.name || "—"}</td>
                <td>{b.requestedQuantity.toLocaleString("fr")}</td>
                <td>{new Date(b.productionDate).toLocaleDateString()}</td>
                <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                <td><StatusPill status={b.status} /></td>
                <td>
                  <Link to={`/dashboard/batches/${b.id}`} className="btn btn--ghost btn--sm">
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
