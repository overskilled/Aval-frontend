import { useEffect, useState } from "react";
import { api } from "../../auth/api.js";
import { CACHE, invalidateCache } from "../../utils/cache.js";

const EMPTY = {
  legalName: "",
  tradeName: "",
  rccm: "",
  taxId: "",
  oapiId: "",
  sector: "",
  country: "Cameroun",
  city: "",
  address: "",
  phone: "",
  website: "",
};

export default function InstitutionForm() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const inst = await api.getMyInstitution();
        if (alive && inst) setForm({ ...EMPTY, ...inst });
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Send only the fields the form actually owns. The loaded institution
      // also carries id/ownerId/createdAt/updatedAt which the DTO whitelist
      // (forbidNonWhitelisted) would reject.
      const payload = Object.fromEntries(
        Object.keys(EMPTY)
          .map((k) => [k, form[k]])
          .filter(([, v]) => v !== "" && v != null),
      );
      await api.upsertMyInstitution(payload);
      invalidateCache(CACHE.institution);
      setSavedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="empty">Chargement…</div>;

  return (
    <>
      <h1>Profil institutionnel</h1>
      <p className="sub">
        Identité officielle de votre organisation. Ces informations seront vérifiées par
        un administrateur lors de la procédure KYC.
      </p>

      {error ? <div className="alert">{error}</div> : null}
      {savedAt ? <div className="alert ok">Enregistré à {savedAt.toLocaleTimeString()}</div> : null}

      <form className="dash-form" onSubmit={onSubmit}>
        <label className="full">
          Raison sociale
          <input value={form.legalName} onChange={(e) => update("legalName", e.target.value)} required maxLength={160} />
        </label>
        <label>
          Nom commercial
          <input value={form.tradeName} onChange={(e) => update("tradeName", e.target.value)} maxLength={160} />
        </label>
        <label>
          Secteur d'activité
          <input value={form.sector} onChange={(e) => update("sector", e.target.value)} required maxLength={80} placeholder="Eaux & boissons, Pharmacie…" />
        </label>
        <label>
          RCCM
          <input value={form.rccm} onChange={(e) => update("rccm", e.target.value)} maxLength={80} />
        </label>
        <label>
          Numéro Identifiant Unique (NIU)
          <input value={form.taxId} onChange={(e) => update("taxId", e.target.value)} maxLength={80} />
        </label>
        <label>
          Numéro OAPI
          <input value={form.oapiId} onChange={(e) => update("oapiId", e.target.value)} maxLength={80} />
        </label>
        <label>
          Pays
          <input value={form.country} onChange={(e) => update("country", e.target.value)} maxLength={80} />
        </label>
        <label>
          Ville
          <input value={form.city} onChange={(e) => update("city", e.target.value)} maxLength={80} />
        </label>
        <label className="full">
          Adresse
          <input value={form.address} onChange={(e) => update("address", e.target.value)} maxLength={200} />
        </label>
        <label>
          Téléphone
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={40} />
        </label>
        <label>
          Site web
          <input value={form.website} onChange={(e) => update("website", e.target.value)} maxLength={200} placeholder="https://…" />
        </label>

        <div className="btn-row full">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"} <span>→</span>
          </button>
        </div>
      </form>
    </>
  );
}
