import SiteShell from "./SiteShell.jsx";
import { SectionHead } from "../../App.jsx";
import { PageHero, PageCta } from "./page-blocks.jsx";

export default function Manufacturers() {
  return (
    <SiteShell screenLabel="Aval — Pour les industriels">
      {({ t, lang }) => {
        const p = t.pages.manufacturers;
        return (
          <>
            <PageHero eyebrow={p.eyebrow} title={p.title} lede={p.lede} facts={p.facts} />

            <section className="page-section">
              <div className="container">
                <SectionHead eyebrow={lang === "fr" ? "§ Onboarding" : "§ Onboarding"} title={p.steps_title} />
                <div className="page-steps">
                  {p.steps.map((s, i) => (
                    <div className="page-step" key={i}>
                      <div className="n">{s.n}</div>
                      <div className="t">{s.t}</div>
                      <div className="d">{s.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="page-section">
              <div className="container">
                <SectionHead eyebrow={lang === "fr" ? "§ Compatibilité" : "§ Compatibility"} title={p.compat_title} />
                <div className="page-two-col">
                  <p className="page-body">{p.compat_body}</p>
                  <ul className="page-list">
                    {p.compat_items.map((it, i) => <li key={i}>{it}</li>)}
                  </ul>
                </div>
              </div>
            </section>

            <section className="page-section">
              <div className="container">
                <SectionHead eyebrow={lang === "fr" ? "§ Tarification" : "§ Pricing"} title={p.pricing_title} />
                <div className="page-two-col">
                  <p className="page-body">{p.pricing_body}</p>
                  <table className="page-table">
                    <tbody>
                      {p.pricing_table.map((r, i) => (
                        <tr key={i}>
                          <th>{r.k}</th>
                          <td>{r.v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

