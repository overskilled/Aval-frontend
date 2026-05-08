import { useEffect, useState } from "react";
import { getAdminToken, setAdminToken } from "../../../auth/api.js";

/**
 * Gate that requires the admin shared-secret to be set in this browser session.
 * The token is sent via X-Admin-Token header on every admin API call.
 * In production: rotate this regularly, ideally pair with hardware MFA.
 */
export default function AdminGate({ children }) {
  const [hasToken, setHasToken] = useState(() => !!getAdminToken());
  const [token, setToken] = useState("");

  useEffect(() => {
    setHasToken(!!getAdminToken());
  }, []);

  function arm(e) {
    e.preventDefault();
    setAdminToken(token.trim());
    setHasToken(true);
  }

  function disarm() {
    setAdminToken(null);
    setHasToken(false);
  }

  if (!hasToken) {
    return (
      <>
        <h1>Accès administrateur</h1>
        <p className="sub">
          Le tableau d'administration est protégé par un <b>second facteur</b> :
          un jeton partagé envoyé dans l'en-tête <code>X-Admin-Token</code> à chaque
          appel d'API d'administration. Même si un compte admin est compromis,
          ce jeton est requis pour exécuter la moindre action sensible.
        </p>
        <details className="tile" style={{ marginBottom: 18 }}>
          <summary style={{ cursor: "pointer", fontWeight: 500 }}>
            D'où vient ce jeton ?
          </summary>
          <p style={{ marginTop: 10 }}>
            Il est défini côté serveur dans la variable d'environnement{" "}
            <code>ADMIN_API_TOKEN</code> (fichier <code>backend/.env</code>).
            Demandez sa valeur à l'équipe d'infrastructure ; ne la partagez jamais
            par chat ou email.
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
            En développement local, il s'agit de la valeur de <code>ADMIN_API_TOKEN</code>{" "}
            dans votre <code>backend/.env</code> — par défaut quelque chose comme{" "}
            <code>dev-admin-token-replace-me</code>. À remplacer impérativement en
            production (rotation régulière + couplage MFA matérielle recommandés).
          </p>
        </details>
        <form className="dash-form" onSubmit={arm}>
          <label className="full">
            Jeton X-Admin-Token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              autoFocus
              required
              placeholder="Collez ici la valeur de ADMIN_API_TOKEN"
            />
          </label>
          <div className="btn-row full">
            <button type="submit" className="btn">Activer la session admin <span>→</span></button>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <div className="admin-banner">
        <b>Session administrateur active.</b> Toutes vos actions sont enregistrées
        dans le journal d'audit avec votre identité et votre adresse IP.{" "}
        <button type="button" className="auth-link strong" onClick={disarm}>
          Désarmer
        </button>
      </div>
      {children}
    </>
  );
}
