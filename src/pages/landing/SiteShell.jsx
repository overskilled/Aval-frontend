import { useEffect } from "react";
import AVAL_I18N from "../../i18n.js";
import { Header, Footer, useLang } from "../../App.jsx";

// Wraps a non-landing page with Aval's Header / Footer chrome and the
// language toggle, so each page only describes its content body.
export default function SiteShell({ screenLabel, children }) {
  const [lang, setLang] = useLang();
  const t = AVAL_I18N[lang];
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="shell" data-screen-label={screenLabel || "Aval"}>
      <Header lang={lang} setLang={setLang} t={t} />
      <main>{typeof children === "function" ? children({ lang, setLang, t }) : children}</main>
      <Footer t={t} lang={lang} setLang={setLang} />
    </div>
  );
}
