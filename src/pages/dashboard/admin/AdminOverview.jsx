import { useEffect, useState } from "react";
import AdminGate from "./AdminGate.jsx";
import { api } from "../../../auth/api.js";

export default function AdminOverview() {
  return (
    <AdminGate>
      <Inner />
    </AdminGate>
  );
}

function Inner() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await api.adminOverview();
        if (alive) setData(d);
      } catch (err) {
        if (alive) setError(err.message);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <>
      <h1>Vue d'ensemble — Administration</h1>
      <p className="sub">
        KPIs globaux et connexions récentes. Toutes les actions effectuées ici sont
        journalisées.
      </p>

      {error ? <div className="alert">{error}</div> : null}
      {!data ? <div className="empty">Chargement…</div> : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card"><div className="k">Utilisateurs</div><div className="v">{data.counts.users}</div></div>
            <div className="kpi-card"><div className="k">Espaces de travail</div><div className="v">{data.counts.workspaces}</div></div>
            <div className="kpi-card"><div className="k">Notes</div><div className="v">{data.counts.notes}</div></div>
          </div>

          <h2>Connexions récentes</h2>
          {data.recentLogins.length === 0 ? (
            <div className="empty">Aucune connexion enregistrée.</div>
          ) : (
            <table className="simple">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Dernière connexion</th>
                </tr>
              </thead>
              <tbody>
                {data.recentLogins.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td><span className="role-pill">{u.role}</span></td>
                    <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  );
}
