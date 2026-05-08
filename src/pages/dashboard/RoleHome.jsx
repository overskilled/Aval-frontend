import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { api } from "../../auth/api.js";
import OnboardingScreen from "./OnboardingScreen.jsx";

function StatusPill({ status }) {
  return (
    <span className={`status-pill ${status}`}>
      <span>●</span>
      {status.replace("_", " ")}
    </span>
  );
}

/**
 * Manufacturer / government users with kycStatus !== "approved" see a focused
 * onboarding flow until verification is complete. Citizens and admins always
 * see the regular dashboard. Once approved, KYC mentions disappear from the
 * dashboard entirely.
 */
function needsOnboarding(user) {
  if (!user) return false;
  if (user.role !== "manufacturer" && user.role !== "government") return false;
  return user.kycStatus !== "approved";
}

export default function RoleHome() {
  const { user } = useAuth();

  if (needsOnboarding(user)) {
    return <OnboardingScreen />;
  }

  return <RegularHome user={user} />;
}

function RegularHome({ user }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ws = await api.listWorkspaces().catch(() => []);
        if (!alive) return;
        setWorkspaces(ws || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <>
      <h1>Bonjour {user.firstName || user.fullName}.</h1>
      <p className="sub">
        {user.role === "admin"
          ? "Vous disposez des privilèges d'administration."
          : user.role === "manufacturer"
            ? "Votre compte est vérifié — vous pouvez gérer vos références produit, demander des lots et suivre vos signalements."
            : user.role === "government"
              ? "Consultez les espaces de travail et les rapports d'application."
              : "Scannez, vérifiez et suivez vos signalements."}
      </p>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="k">Espaces de travail</div>
          <div className="v">{loading ? "—" : workspaces.length}</div>
        </div>
        <div className="kpi-card">
          <div className="k">Compte</div>
          <div className="v" style={{ fontSize: 20 }}>
            <StatusPill status="approved" />
          </div>
        </div>
      </div>

      {(user.role === "manufacturer" || user.role === "government") && (
        <>
          <h2>Raccourcis</h2>
          <div className="ws-grid">
            <Link to="/dashboard/skus" className="ws-card">
              <div className="name">Références (SKU)</div>
              <div className="desc">Enregistrez vos produits et faites-les approuver.</div>
              <div className="meta">→ Ouvrir</div>
            </Link>
            <Link to="/dashboard/batches" className="ws-card">
              <div className="name">Lots de codes</div>
              <div className="desc">Demandez et gérez vos lots de codes signés.</div>
              <div className="meta">→ Ouvrir</div>
            </Link>
            <Link to="/dashboard/workspaces" className="ws-card">
              <div className="name">Espaces collaboratifs</div>
              <div className="desc">Travaillez en équipe : notes, membres, partages.</div>
              <div className="meta">→ Ouvrir</div>
            </Link>
          </div>
        </>
      )}

      {user.role === "admin" && (
        <>
          <h2>Administration</h2>
          <div className="ws-grid">
            <Link to="/dashboard/admin" className="ws-card">
              <div className="name">Vue d'ensemble</div>
              <div className="desc">KPIs et connexions récentes.</div>
              <div className="meta">→ Ouvrir</div>
            </Link>
            <Link to="/dashboard/admin/kyc" className="ws-card">
              <div className="name">Revue KYC</div>
              <div className="desc">Approuver ou rejeter les soumissions.</div>
              <div className="meta">→ Ouvrir</div>
            </Link>
            <Link to="/dashboard/admin/batches" className="ws-card">
              <div className="name">Revue lots</div>
              <div className="desc">Approuver et générer les lots de codes.</div>
              <div className="meta">→ Ouvrir</div>
            </Link>
          </div>
        </>
      )}

      {/* Workspaces are an institution-side collaboration tool — admins
          don't need them on their home. */}
      {user.role !== "admin" && (
        <>
          <h2>Vos espaces de travail récents</h2>
          {loading ? (
            <div className="empty">Chargement…</div>
          ) : workspaces.length === 0 ? (
            <div className="empty">
              Aucun espace pour le moment.{" "}
              <Link to="/dashboard/workspaces" className="auth-link strong">
                Créer un espace
              </Link>.
            </div>
          ) : (
            <div className="ws-grid">
              {workspaces.slice(0, 6).map((w) => (
                <Link key={w.id} to={`/dashboard/workspaces/${w.id}`} className="ws-card">
                  <div className="name">{w.name}</div>
                  <div className="desc">{w.description || "—"}</div>
                  <div className="meta">
                    {w._count?.members ?? "—"} membres · {w._count?.notes ?? "—"} notes
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

export { needsOnboarding };
