import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../auth/api.js";
import { useAuth } from "../../auth/AuthContext.jsx";

export default function Workspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const ws = await api.getWorkspace(id);
      setData(ws);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const myMembership = data?.members?.find((m) => m.userId === user.id);
  const isOwner = myMembership?.role === "owner";
  const canPost = myMembership && myMembership.role !== "viewer";

  async function onInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError("");
    try {
      await api.addMember(id, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function onUpdateRole(memberId, role) {
    try {
      await api.updateMember(id, memberId, { role });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onRemove(memberId) {
    if (!confirm("Retirer ce membre de l'espace ?")) return;
    try {
      await api.removeMember(id, memberId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onPost(e) {
    e.preventDefault();
    if (!noteTitle.trim() || !noteBody.trim()) return;
    setPosting(true);
    try {
      await api.createNote(id, { title: noteTitle.trim(), body: noteBody.trim() });
      setNoteTitle("");
      setNoteBody("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function onDeleteNote(noteId) {
    if (!confirm("Supprimer cette note ?")) return;
    try {
      await api.deleteNote(id, noteId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="empty">Chargement…</div>;
  if (!data) {
    return (
      <>
        <h1>Espace introuvable</h1>
        {error ? <div className="alert">{error}</div> : null}
        <Link to="/dashboard/workspaces" className="btn btn--ghost">← Retour</Link>
      </>
    );
  }

  return (
    <>
      <Link to="/dashboard/workspaces" className="auth-link" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Tous les espaces
      </Link>
      <h1>{data.name}</h1>
      <p className="sub">{data.description || "—"}</p>

      {error ? <div className="alert">{error}</div> : null}

      <h2>Membres ({data.members.length})</h2>
      <div className="member-list">
        {data.members.map((m) => (
          <div key={m.id} className="member-row">
            <div>
              <div className="name">{m.user.fullName}</div>
              <div className="email">{m.user.email}</div>
            </div>
            <span className="role-pill">{m.role}</span>
            {isOwner && m.role !== "owner" ? (
              <select
                value={m.role}
                onChange={(e) => onUpdateRole(m.id, e.target.value)}
                style={{ fontSize: 13, padding: "6px 8px" }}
              >
                <option value="editor">editor</option>
                <option value="viewer">viewer</option>
              </select>
            ) : <span />}
            {isOwner && m.role !== "owner" ? (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onRemove(m.id)}
              >
                Retirer
              </button>
            ) : <span />}
          </div>
        ))}
      </div>

      {isOwner && (
        <>
          <h2>Inviter un membre</h2>
          <form className="dash-form" onSubmit={onInvite}>
            <label>
              Email
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="utilisateur@org.cm"
                required
              />
            </label>
            <label>
              Rôle
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="editor">editor</option>
                <option value="viewer">viewer</option>
              </select>
            </label>
            <div className="btn-row full">
              <button type="submit" className="btn" disabled={inviting}>
                {inviting ? "Invitation…" : "Inviter"} <span>→</span>
              </button>
              <span className="meta" style={{ fontSize: 12, color: "var(--muted)" }}>
                L'utilisateur doit déjà avoir un compte Aval.
              </span>
            </div>
          </form>
        </>
      )}

      <h2>Notes partagées ({data.notes.length})</h2>
      {canPost && (
        <form className="dash-form" onSubmit={onPost}>
          <label className="full">
            Titre
            <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} maxLength={200} required />
          </label>
          <label className="full">
            Contenu
            <textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} maxLength={20000} required />
          </label>
          <div className="btn-row full">
            <button type="submit" className="btn" disabled={posting}>
              {posting ? "Publication…" : "Publier"} <span>→</span>
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 18 }}>
        {data.notes.length === 0 ? (
          <div className="empty">Aucune note pour le moment.</div>
        ) : (
          data.notes.map((n) => (
            <div key={n.id} className="note-card">
              <div className="n-head">
                <h4>{n.title}</h4>
                <span className="n-meta">
                  {n.author?.fullName} · {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="body">{n.body}</p>
              {(n.authorId === user.id || isOwner) && (
                <div className="btn-row" style={{ marginTop: 10 }}>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => onDeleteNote(n.id)}>
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
