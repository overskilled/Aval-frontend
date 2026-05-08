import { useState } from "react";
import SiteShell from "./SiteShell.jsx";
import { SectionHead } from "../../App.jsx";
import { PageHero, PageCta } from "./page-blocks.jsx";

export default function Trust() {
  return (
    <SiteShell screenLabel="Aval — Confiance & souveraineté">
      {({ t, lang }) => {
        const p = t.pages.trust;
        return (
          <>
            <PageHero eyebrow={p.eyebrow} title={p.title} lede={p.lede} facts={p.facts} />

            <section className="page-section">
              <div className="container">
                <SectionHead eyebrow={lang === "fr" ? "§ Cryptographie" : "§ Cryptography"} title={p.sec_title} />
                <div className="page-two-col">
                  <p className="page-body">{p.sec_body}</p>
                  <ul className="page-list">
                    {p.sec_items.map((it, i) => <li key={i}>{it}</li>)}
                  </ul>
                </div>
              </div>
            </section>

            <section className="page-section">
              <div className="container">
                <SectionHead eyebrow={lang === "fr" ? "§ Souveraineté" : "§ Sovereignty"} title={p.sov_title} />
                <div className="page-two-col">
                  <p className="page-body">{p.sov_body}</p>
                  <ul className="page-list">
                    {p.sov_items.map((it, i) => <li key={i}>{it}</li>)}
                  </ul>
                </div>
              </div>
            </section>

            <section className="page-section">
              <div className="container">
                <SectionHead eyebrow={lang === "fr" ? "§ Vérification" : "§ Verification"} title={p.verify_title} />
                <p className="page-body page-body--lone">{p.verify_body}</p>
              </div>
            </section>

            <section className="page-section">
              <div className="container">
                <SectionHead eyebrow={lang === "fr" ? "§ FAQ" : "§ FAQ"} title={p.faq_title} />
                <div className="page-faq">
                  {p.faq.map((qa, i) => <FaqItem key={i} q={qa.q} a={qa.a} />)}
                </div>
              </div>
            </section>

            <PageCta kicker={p.cta_kicker} title={p.cta_title} body={p.cta_body} btn={p.cta_btn} />
          </>
        );
      }}
    </SiteShell>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="page-faq-item" open={open} onToggle={(e) => setOpen(e.target.open)}>
      <summary>
        <span className="q">{q}</span>
        <span className="sign" aria-hidden="true">{open ? "−" : "+"}</span>
      </summary>
      <p className="a">{a}</p>
    </details>
  );
}
