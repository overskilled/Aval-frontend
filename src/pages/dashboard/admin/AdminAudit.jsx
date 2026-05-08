import { useEffect, useState } from "react";
import AdminGate from "./AdminGate.jsx";
import Drawer from "./_components/Drawer.jsx";
import DataTable from "./_components/DataTable.jsx";
import { api } from "../../../auth/api.js";

export default function AdminAudit() {
  return <AdminGate><Inner /></AdminGate>;
}

function Inner() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await api.adminAuditLog();
        if (alive) setList(d);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const columns = [
    { key: "createdAt", label: "Horodatage", render: (l) => new Date(l.createdAt).toLocaleString() },
    { key: "actor", label: "Acteur", render: (l) => (
        <>
          <div>{l.actor?.fullName}</div>
          <div className="id" style={{ fontSize: 11 }}>{l.actor?.email}</div>
        </>
      ) },
    { key: "action", label: "Action", render: (l) => <span className="role-pill">{l.action}</span> },
    { key: "target", label: "Cible", render: (l) => <span className="id">{l.target || "—"}</span> },
    { key: "ip", label: "IP", render: (l) => <span className="id">{l.ip || "—"}</span> },
  ];

  return (
    <>
      <h1>Journal d'audit</h1>
      <p className="sub">Toutes les actions administratives. Lecture seule.</p>
      {error ? <div className="alert">{error}</div> : null}

      {loading ? <div className="empty">Chargement…</div> : (
        <DataTable
          columns={columns}
          rows={list}
          onRowClick={setSelected}
          emptyText="Aucune action enregistrée."
          initialPageSize={50}
        />
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.action || ""}
        subtitle={selected ? new Date(selected.createdAt).toLocaleString() : ""}
        footer={
          selected ? (
            <button type="button" className="btn btn--ghost" onClick={() => setSelected(null)}>Fermer</button>
          ) : null
        }
      >
        {selected ? (
          <>
            <table className="simple">
              <tbody>
                <tr><th>Action</th><td><span className="role-pill">{selected.action}</span></td></tr>
                <tr><th>Acteur</th><td>{selected.actor?.fullName} ({selected.actor?.email})</td></tr>
                <tr><th>Cible</th><td><span className="id">{selected.target || "—"}</span></td></tr>
                <tr><th>IP</th><td><span className="id">{selected.ip || "—"}</span></td></tr>
                <tr><th>Horodatage</th><td>{new Date(selected.createdAt).toLocaleString()}</td></tr>
              </tbody>
            </table>
            {selected.metadata ? (
              <>
                <h3 style={{ marginTop: 18 }}>Métadonnées</h3>
                <pre style={{ background: "var(--paper-2)", padding: 12, fontSize: 12, overflow: "auto" }}>
                  {tryFormatJson(selected.metadata)}
                </pre>
              </>
            ) : null}
          </>
        ) : null}
      </Drawer>
    </>
  );
}

function tryFormatJson(s) {
  try { return JSON.stringify(JSON.parse(s), null, 2); }
  catch { return String(s); }
}
