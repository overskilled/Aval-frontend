import SiteShell from "./SiteShell.jsx";
import { SectionHead } from "../../App.jsx";
import { PageHero, PageCta } from "./page-blocks.jsx";

export default function Regulators() {
  return (
    <SiteShell screenLabel="Aval — Pour l'État">
      {({ t, lang }) => {
        const p = t.pages.regulators;
        return (
          <>
            <PageHero eyebrow={p.eyebrow} title={p.title} lede={p.lede} facts={p.facts} />

            <section className="page-section">
              <div className="container">
                <SectionHead eyebrow={lang === "fr" ? "§ Capacités" : "§ Capabilities"} title={p.cards_title} />
                <div className="page-cards">
                  {p.cards.map((c, i) => (
                    <div className="page-card" key={i}>
                      <div className="num">0{i + 1}</div>
                      <h4>{c.t}</h4>
                      <p>{c.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="page-section">
              <div className="container">
                <SectionHead eyebrow={lang === "fr" ? "§ Souveraineté" : "§ Sovereignty"} title={p.sovereignty_title} />
                <div className="page-two-col">
                  <p className="page-body">{p.sovereignty_body}</p>
                  <ul className="page-list">
                    {p.sovereignty_items.map((it, i) => <li key={i}>{it}</li>)}
                  </ul>
                </div>
              </div>
            </section>

            <section className="page-section">
              <div className="container">
                <SectionHead eyebrow={lang === "fr" ? "§ Cadre" : "§ Framework"} title={p.legal_title} />
                <p className="page-body page-body--lone">{p.legal_body}</p>
              </div>
            </section>

            <PageCta kicker={p.cta_kicker} title={p.cta_title} body={p.cta_body} btn={p.cta_btn} />
          </>
        );
      }}
    </SiteShell>
  );
}
