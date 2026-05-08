import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../auth/api.js";

export default function Workspaces() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setList(await api.listWorkspaces());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const w = await api.createWorkspace({ name: name.trim(), description: desc.trim() || undefined });
      setName("");
      setDesc("");
      setList((prev) => [w, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <h1>Espaces de travail</h1>
      <p className="sub">
        Vos espaces collaboratifs. Chaque institution peut créer des espaces pour
        coordonner ses équipes — notes partagées, membres avec rôles (éditeur,
        lecteur), invitations par email.
      </p>

      <h2>Nouvel espace</h2>
      <form className="dash-form" onSubmit={onCreate}>
        <label className="full">
          Nom de l'espace
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
        </label>
        <label className="full">
          Description
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={2000} />
        </label>
        {error ? <div className="alert full">{error}</div> : null}
        <div className="btn-row full">
          <button type="submit" className="btn" disabled={creating}>
            {creating ? "Création…" : "Créer l'espace"} <span>→</span>
          </button>
        </div>
      </form>

      <h2>Vos espaces</h2>
      {loading ? (
        <div className="empty">Chargement…</div>
      ) : list.length === 0 ? (
        <div className="empty">Aucun espace pour le moment. Créez le premier ci-dessus.</div>
      ) : (
        <div className="ws-grid">
          {list.map((w) => (
            <Link key={w.id} to={`/dashboard/workspaces/${w.id}`} className="ws-card">
              <div className="name">{w.name}</div>
              <div className="desc">{w.description || "—"}</div>
              <div className="meta">
                {w._count?.members ?? 0} membres · {w._count?.notes ?? 0} notes
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
