import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { needsOnboarding } from "./RoleHome.jsx";

const ROLE_LABEL = {
  citizen: "Citoyen",
  manufacturer: "Industriel",
  government: "État",
  admin: "Administrateur",
};

function MiniSeal() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="none" stroke="#f4ede0" strokeWidth="0.8" />
      <circle cx="20" cy="20" r="15" fill="none" stroke="#f4ede0" strokeWidth="0.6" />
      <circle cx="20" cy="20" r="8" fill="#f4ede0" />
      <polygon points="20,16 21.18,18.94 24.5,19.18 21.91,21.32 22.85,24.56 20,22.8 17.15,24.56 18.09,21.32 15.5,19.18 18.82,18.94" fill="#fcd116" />
    </svg>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Lock body scroll while drawer is open on mobile.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!user) return null;
  const onboarding = needsOnboarding(user);

  return (
    <div className={`dash-shell${drawerOpen ? " is-drawer-open" : ""}`}>
      <header className="dash-topbar">
        <button
          type="button"
          className="dash-menu-btn"
          aria-label="Menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((v) => !v)}
        >
          {drawerOpen ? "✕" : "≡"}
        </button>
        <Link to="/dashboard" className="dash-topbar-brand">
          <MiniSeal />
          <span>Aval</span>
        </Link>
        <button
          type="button"
          className="dash-topbar-logout"
          onClick={onLogout}
          aria-label="Se déconnecter"
        >
          ⎋
        </button>
      </header>

      <div
        className="dash-scrim"
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <aside className="dash-side" aria-label="Navigation">
        <Link to="/dashboard" className="brand">
          <MiniSeal />
          <span className="word">Aval</span>
        </Link>

        {onboarding ? (
          // Onboarding mode: only the activation step is reachable. Other
          // navigation is intentionally hidden so the user has one clear path.
          <>
            <h6>Activation du compte</h6>
            <nav>
              <NavLink to="/dashboard" end>Mon dossier</NavLink>
            </nav>
          </>
        ) : user.role === "admin" ? (
          // Admins live in the Administration section. Workspaces & co. are
          // tools for institutions, not for the operators reviewing them.
          <>
            <h6>Administration</h6>
            <nav>
              <NavLink to="/dashboard" end>Tableau de bord</NavLink>
              <NavLink to="/dashboard/admin" end>Vue d'ensemble</NavLink>
              <NavLink to="/dashboard/admin/users">Utilisateurs</NavLink>
              <NavLink to="/dashboard/admin/kyc">Revue KYC</NavLink>
              <NavLink to="/dashboard/admin/skus">Revue SKUs</NavLink>
              <NavLink to="/dashboard/admin/batches">Revue lots</NavLink>
              <NavLink to="/dashboard/admin/institutions">Institutions</NavLink>
              <NavLink to="/dashboard/admin/audit">Journal d'audit</NavLink>
            </nav>
          </>
        ) : (
          <>
            <h6>Espace</h6>
            <nav>
              <NavLink to="/dashboard" end>Tableau de bord</NavLink>
              <NavLink to="/dashboard/workspaces">Espaces de travail</NavLink>
              {(user.role === "manufacturer" || user.role === "government") && (
                <>
                  <NavLink to="/dashboard/institution">Profil institutionnel</NavLink>
                  <NavLink to="/dashboard/skus">Références (SKU)</NavLink>
                  <NavLink to="/dashboard/batches">Lots de codes</NavLink>
                </>
              )}
            </nav>
          </>
        )}

        <div className="me">
          <p className="name">{user.fullName}</p>
          <div className="email">{user.email}</div>
          <span className="role">{ROLE_LABEL[user.role] || user.role}</span>
          <button type="button" onClick={onLogout}>Se déconnecter</button>
        </div>
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
