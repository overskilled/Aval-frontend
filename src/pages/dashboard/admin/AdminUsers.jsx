import { useCallback, useEffect, useState } from "react";
import AdminGate from "./AdminGate.jsx";
import Drawer from "./_components/Drawer.jsx";
import DataTable from "./_components/DataTable.jsx";
import ConfirmStep from "./_components/ConfirmStep.jsx";
import { api } from "../../../auth/api.js";
import { useAuth } from "../../../auth/AuthContext.jsx";

const ROLES = ["citizen", "manufacturer", "government", "admin"];

export default function AdminUsers() {
  return <AdminGate><Inner /></AdminGate>;
}

function Inner() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(null); // null | "role" | "delete"
  const [nextRole, setNextRole] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setUsers(await api.adminListUsers()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function open(row) {
    setSelected(row); setPending(null); setNextRole(null); setError("");
  }
  function close() {
    setSelected(null); setPending(null); setNextRole(null);
  }

  async function runRoleChange() {
    if (!nextRole) return;
    setBusy(true); setError("");
    try {
      await api.adminSetRole(selected.id, nextRole);
      await load(); close();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function runDelete() {
    setBusy(true); setError("");
    try {
      await api.adminDeleteUser(selected.id);
      await load(); close();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const columns = [
    { key: "fullName", label: "Nom" },
    { key: "email", label: "Email" },
    { key: "role", label: "Rôle", render: (u) => <span className={`status-pill ${u.role}`}>{u.role}</span> },
    { key: "emailVerified", label: "Email vérifié", render: (u) => u.emailVerified ? "Oui" : "Non" },
    { key: "kycStatus", label: "KYC", render: (u) => u.kycStatus || "—" },
    { key: "createdAt", label: "Inscrit", render: (u) => new Date(u.createdAt).toLocaleDateString() },
  ];

  return (
    <>
      <h1>Utilisateurs</h1>
      <p className="sub">Gestion des rôles et de l'accès.</p>
      {error && !selected ? <div className="alert">{error}</div> : null}

      {loading ? <div className="empty">Chargement…</div> : (
        <DataTable
          columns={columns}
          rows={users}
          onRowClick={open}
          emptyText="Aucun utilisateur."
        />
      )}

      <Drawer
        open={!!selected}
        onClose={close}
        title={selected?.fullName || ""}
        subtitle={selected?.email || ""}
        footer={
          selected && !pending ? (
            <>
              <button type="button" className="btn btn--ghost" onClick={close}>Fermer</button>
              {selected.id !== me.id && (
                <>
                  <button type="button" className="btn btn--danger" onClick={() => setPending("delete")}>
                    Supprimer
                  </button>
                  <button type="button" className="btn" onClick={() => { setPending("role"); setNextRole(selected.role); }}>
                    Changer le rôle
                  </button>
                </>
              )}
            </>
          ) : null
        }
      >
        {selected ? (
          pending === "role" ? (
            <ConfirmStep
              title="Changer le rôle ?"
              description={`Sélectionnez le nouveau rôle pour ${selected.fullName}. Le changement prend effet immédiatement.`}
              warning={error || undefined}
              busy={busy}
              confirmLabel={`Définir le rôle : ${nextRole}`}
              onCancel={() => { setPending(null); setError(""); }}
              onConfirm={runRoleChange}
            >
              <label style={{ display: "block", marginTop: 6 }}>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, letterSpacing: "0.12em", color: "var(--muted)", textTransform: "uppercase" }}>
                  Nouveau rôle
                </span>
                <select
                  value={nextRole || selected.role}
                  onChange={(e) => setNextRole(e.target.value)}
                  style={{ width: "100%", marginTop: 6, padding: 8 }}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
            </ConfirmStep>
          ) : pending === "delete" ? (
            <ConfirmStep
              title="Supprimer cet utilisateur ?"
              description={`Cette action est définitive. Toutes les données rattachées (institution, KYC, SKUs, lots) seront cascadées et supprimées.`}
              warning={error || `Vous êtes sur le point de supprimer ${selected.email}.`}
              danger busy={busy}
              confirmLabel="Confirmer la suppression"
              onCancel={() => { setPending(null); setError(""); }}
              onConfirm={runDelete}
            />
          ) : (
            <UserDetail user={selected} isMe={selected.id === me.id} />
          )
        ) : null}
      </Drawer>
    </>
  );
}

function UserDetail({ user, isMe }) {
  return (
    <table className="simple">
      <tbody>
        <tr><th>Nom</th><td>{user.fullName}</td></tr>
        <tr><th>Email</th><td>{user.email}</td></tr>
        <tr><th>Rôle</th><td><span className={`status-pill ${user.role}`}>{user.role}</span></td></tr>
        <tr><th>Email vérifié</th><td>{user.emailVerified ? "Oui" : "Non"}</td></tr>
        <tr><th>Statut KYC</th><td>{user.kycStatus || "—"}</td></tr>
        <tr><th>Pays</th><td>{user.country || "—"}</td></tr>
        <tr><th>Organisation</th><td>{user.organisation || "—"}</td></tr>
        <tr><th>Inscrit le</th><td>{new Date(user.createdAt).toLocaleString()}</td></tr>
        {user.lastLoginAt ? <tr><th>Dernière connexion</th><td>{new Date(user.lastLoginAt).toLocaleString()}</td></tr> : null}
        {isMe ? <tr><th></th><td><i style={{ color: "var(--muted)" }}>C'est votre propre compte — aucune action disponible.</i></td></tr> : null}
      </tbody>
    </table>
  );
}
