import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import AUTH_I18N from "./i18n.js";
import Panel from "./Panel.jsx";
import { useAuth } from "./AuthContext.jsx";

function useLang() {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("aval.lang");
      if (saved === "fr" || saved === "en") return saved;
    } catch (e) {}
    return "fr";
  });
  useEffect(() => {
    try { localStorage.setItem("aval.lang", lang); } catch (e) {}
    document.documentElement.lang = lang;
  }, [lang]);
  return [lang, setLang];
}

export default function AuthLayout() {
  const [lang, setLang] = useLang();
  const t = AUTH_I18N[lang];
  const common = t.common;
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Allow logged-in users to access /verify-email (still need to verify) and
  // /reset-password (e.g. they kept their session open). Bounce away from the
  // entry forms (login, signup, forgot-password) since they're already in.
  useEffect(() => {
    if (!user) return;
    const path = location.pathname;
    const allowed =
      path.startsWith("/verify-email") ||
      path.startsWith("/reset-password") ||
      path.startsWith("/login-verify");
    if (!allowed) navigate("/dashboard", { replace: true });
  }, [user, navigate, location.pathname]);

  return (
    <div className="auth-shell" data-screen-label="Aval — Authentication">
      <Panel lang={lang} t={t} common={common} />

      <main className="auth-main">
        <Link to="/" className="auth-home-link">
          ← {common.back_home}
        </Link>

        <div className="auth-stage">
          <Outlet context={{ lang, setLang, t, common }} />
        </div>

        <div className="auth-legal">
          <span>© {new Date().getFullYear()} Aval — {common.brand_meta}</span>
          <span>OAPI · CEMAC</span>
        </div>
      </main>
    </div>
  );
}
