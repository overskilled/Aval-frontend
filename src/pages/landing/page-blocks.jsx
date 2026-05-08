// Shared building blocks for the dedicated content pages
// (Manufacturers, Regulators, Trust). All visible strings come from i18n
// via props — these components are layout-only.

export function PageHero({ eyebrow, title, lede, facts }) {
  return (
    <section className="page-hero">
      <div className="container">
        <div className="page-hero-eyebrow"><span className="dot">●</span>&nbsp;{eyebrow}</div>
        <h1 className="page-hero-title">{title}</h1>
        <p className="page-hero-lede">{lede}</p>
        {facts ? (
          <div className="page-fact-row">
            {facts.map((f, i) => (
              <div className="page-fact" key={i}>
                <div className="k">{f.k}</div>
                <div className="v">{f.v}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function PageCta({ kicker, title, body, btn, href = "/#contact" }) {
  return (
    <section className="page-cta-section">
      <div className="container">
        <div className="page-cta">
          <div className="page-cta-kicker">{kicker}</div>
          <h2 className="page-cta-title">{title}</h2>
          <p className="page-cta-body">{body}</p>
          <a href={href} className="btn">{btn}<span className="arrow">→</span></a>
        </div>
      </div>
    </section>
  );
}
