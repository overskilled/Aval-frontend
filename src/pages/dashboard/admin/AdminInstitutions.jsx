import { useEffect, useState } from "react";
import AdminGate from "./AdminGate.jsx";
import Drawer from "./_components/Drawer.jsx";
import DataTable from "./_components/DataTable.jsx";
import { api } from "../../../auth/api.js";

export default function AdminInstitutions() {
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
        const data = await api.adminInstitutions();
        if (alive) setList(data);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const columns = [
    { key: "legalName", label: "Raison sociale", render: (i) => (
        <>
          <div>{i.legalName}</div>
          {i.tradeName ? <div className="id" style={{ fontSize: 11 }}>{i.tradeName}</div> : null}
        </>
      ) },
    { key: "sector", label: "Secteur" },
    { key: "country", label: "Pays / ville", render: (i) => `${i.country}${i.city ? `, ${i.city}` : ""}` },
    { key: "owner", label: "Propriétaire", render: (i) => (
        <>
          <div>{i.owner?.fullName}</div>
          <div className="id" style={{ fontSize: 11 }}>{i.owner?.email}</div>
        </>
      ) },
    { key: "kyc", label: "KYC", render: (i) => i.kyc
        ? <span className={`status-pill ${i.kyc.status}`}>{i.kyc.status}</span>
        : <span className="status-pill not_started">non soumis</span>
    },
    { key: "createdAt", label: "Créée", render: (i) => new Date(i.createdAt).toLocaleDateString() },
  ];

  return (
    <>
      <h1>Institutions enregistrées</h1>
      <p className="sub">Liste des organisations ayant créé un profil institutionnel.</p>
      {error ? <div className="alert">{error}</div> : null}

      {loading ? <div className="empty">Chargement…</div> : (
        <DataTable
          columns={columns}
          rows={list}
          onRowClick={setSelected}
          emptyText="Aucune institution."
        />
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.legalName || ""}
        subtitle={selected?.owner?.email || ""}
        footer={
          selected ? (
            <button type="button" className="btn btn--ghost" onClick={() => setSelected(null)}>Fermer</button>
          ) : null
        }
      >
        {selected ? (
          <table className="simple">
            <tbody>
              <tr><th>Raison sociale</th><td>{selected.legalName}</td></tr>
              <tr><th>Nom commercial</th><td>{selected.tradeName || "—"}</td></tr>
              <tr><th>Secteur</th><td>{selected.sector}</td></tr>
              <tr><th>RCCM</th><td>{selected.rccm || "—"}</td></tr>
              <tr><th>NIU</th><td>{selected.taxId || "—"}</td></tr>
              <tr><th>OAPI</th><td>{selected.oapiId || "—"}</td></tr>
              <tr><th>Pays</th><td>{selected.country}{selected.city ? `, ${selected.city}` : ""}</td></tr>
              <tr><th>Adresse</th><td>{selected.address || "—"}</td></tr>
              <tr><th>Site web</th><td>{selected.website || "—"}</td></tr>
              <tr><th>Téléphone</th><td>{selected.phone || "—"}</td></tr>
              <tr><th>Propriétaire</th><td>{selected.owner?.fullName} ({selected.owner?.email})</td></tr>
              <tr><th>KYC</th><td>
                {selected.kyc
                  ? <span className={`status-pill ${selected.kyc.status}`}>{selected.kyc.status}</span>
                  : <span className="status-pill not_started">non soumis</span>}
              </td></tr>
              <tr><th>Créée le</th><td>{new Date(selected.createdAt).toLocaleString()}</td></tr>
            </tbody>
          </table>
        ) : null}
      </Drawer>
    </>
  );
}
