import { useState, useEffect, useRef } from "react";
import AVAL_I18N from "./i18n.js";

// ——————————————————————————————————————————————
// Hooks
// ——————————————————————————————————————————————
function useInView(opts = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { setSeen(true); io.disconnect(); }
        });
      },
      opts
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

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

// ——————————————————————————————————————————————
// Brand seal (header mini + hero giant)
// ——————————————————————————————————————————————
// 5-point star path centered at (cx,cy) with outer radius r
function starPoints(cx, cy, r) {
  const inner = r * 0.4;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    pts.push(`${(cx + Math.cos(ang) * rad).toFixed(2)},${(cy + Math.sin(ang) * rad).toFixed(2)}`);
  }
  return pts.join(" ");
}

function SealMini() {
  return (
    <svg viewBox="0 0 40 40" className="seal-mini" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="none" stroke="#14181f" strokeWidth="0.8"/>
      <circle cx="20" cy="20" r="15" fill="none" stroke="#14181f" strokeWidth="0.6"/>
      <circle cx="20" cy="20" r="8" fill="#14181f"/>
      <polygon points={starPoints(20, 20, 5)} fill="#fcd116"/>
      <g stroke="#14181f" strokeWidth="0.6">
        <line x1="20" y1="0.5" x2="20" y2="3"/>
        <line x1="20" y1="37" x2="20" y2="39.5"/>
        <line x1="0.5" y1="20" x2="3" y2="20"/>
        <line x1="37" y1="20" x2="39.5" y2="20"/>
      </g>
    </svg>
  );
}

function HeroSeal({ outerText, innerText }) {
  return (
    <div className="seal-stage" aria-hidden="true">
      <svg className="ring" viewBox="0 0 200 200">
        <defs>
          <path id="hr-out" d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0" fill="none"/>
        </defs>
        <circle cx="100" cy="100" r="98" fill="none" stroke="#14181f" strokeWidth="0.8"/>
        <circle cx="100" cy="100" r="92" fill="none" stroke="#14181f" strokeWidth="0.5"/>
        <text fontFamily="IBM Plex Mono, monospace" fontSize="6.4" letterSpacing="3" fill="#14181f">
          <textPath href="#hr-out" startOffset="0">{outerText.repeat(3)}</textPath>
        </text>
      </svg>
      <svg className="ring-inner" viewBox="0 0 200 200">
        <defs>
          <path id="hr-in" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" fill="none"/>
        </defs>
        <circle cx="100" cy="100" r="76" fill="none" stroke="#14181f" strokeWidth="0.4"/>
        <text fontFamily="IBM Plex Mono, monospace" fontSize="5" letterSpacing="2.4" fill="#6c6655">
          <textPath href="#hr-in" startOffset="0">{innerText.repeat(4)}</textPath>
        </text>
      </svg>
      <svg className="orbit" viewBox="0 0 200 200">
        <polygon points={starPoints(100, 14, 5)} fill="#fcd116" stroke="#14181f" strokeWidth="0.4"/>
      </svg>
      <svg className="tick" viewBox="0 0 200 200">
        <line x1="100" y1="0" x2="100" y2="6"/>
        <line x1="100" y1="194" x2="100" y2="200"/>
        <line x1="0" y1="100" x2="6" y2="100"/>
        <line x1="194" y1="100" x2="200" y2="100"/>
      </svg>
      <div className="core">
        <div>
          <div className="word">Aval</div>
          <div className="meta">RÉPUBLIQUE DU CAMEROUN</div>
        </div>
      </div>
      <svg className="cmr-star" viewBox="0 0 200 200" aria-hidden="true">
        <polygon points={starPoints(100, 100, 7)} fill="#fcd116" stroke="#14181f" strokeWidth="0.5" opacity="0"/>
      </svg>
    </div>
  );
}

// ——————————————————————————————————————————————
// Header
// ——————————————————————————————————————————————
function Header({ lang, setLang, t }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container row">
        <a href="#top" className="brand" aria-label="Aval">
          <SealMini />
          <span className="word">Aval</span>
        </a>
        <nav className={`nav${open ? " open" : ""}`} aria-label={lang === "fr" ? "Navigation principale" : "Primary navigation"}>
          <a href="#problem" onClick={() => setOpen(false)}>{t.nav.problem}</a>
          <a href="#how" onClick={() => setOpen(false)}>{t.nav.how}</a>
          <a href="#gov" onClick={() => setOpen(false)}>{t.nav.gov}</a>
          <a href="#ind" onClick={() => setOpen(false)}>{t.nav.ind}</a>
          <a href="#cit" onClick={() => setOpen(false)}>{t.nav.cit}</a>
          <a href="#pilot" onClick={() => setOpen(false)}>{t.nav.pilot}</a>
          <a href="#about" onClick={() => setOpen(false)}>{t.nav.about}</a>
        </nav>
        <div className="header-actions">
          <div className="lang-toggle" role="group" aria-label="Language">
            <button aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>FR</button>
            <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
          </div>
          <a href="/login" className="btn btn--ghost btn--sm header-signin">{lang === "fr" ? "Se connecter" : "Sign in"}</a>
          <a href="#contact" className="btn btn--sm">{t.nav.contact}<span className="arrow">→</span></a>
          <button className="menu-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>{open ? "✕" : "≡"}</button>
        </div>
      </div>
    </header>
  );
}

// ——————————————————————————————————————————————
// Hero
// ——————————————————————————————————————————————
function Hero({ t }) {
  return (
    <section className="hero" id="top">
      <div className="container">
        <div className="grid">
          <div>
            <div className="eyebrow"><span className="dot">●</span>&nbsp; {t.hero.kicker}</div>
            <h1>
              <span>{t.hero.headline_1}</span><br />
              <span className="em">{t.hero.headline_2}</span> <span className="ochre">{t.hero.headline_3}</span>
            </h1>
            <p className="sub">{t.hero.sub}</p>
            <div className="cta-row">
              <a href="#contact" className="btn">{t.hero.cta_primary}<span className="arrow">→</span></a>
              <a href="#how" className="btn btn--ghost">{t.hero.cta_secondary}</a>
            </div>
            <div className="pillars">
              {t.hero.pillars.map((p) => (
                <div className="pillar" key={p.k}>
                  <div className="k">{p.k}</div>
                  <div className="t">{p.t}</div>
                  <div className="d">{p.d}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <HeroSeal outerText={t.hero.stamp_outer} innerText={t.hero.stamp_inner} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Ticker
// ——————————————————————————————————————————————
function Ticker({ lang }) {
  const items = lang === "fr"
    ? ["Pré‑pilote · Douala 2026", "Aligné OAPI / CEMAC", "Eaux & boissons", "Régulé par MINCOMMERCE", "Souveraineté des données", "Vérification hors‑ligne", "Compatible flexo / jet d'encre", "WCAG AA"]
    : ["Pre‑pilot · Douala 2026", "Aligned with OAPI / CEMAC", "Water & beverages", "Regulated by MINCOMMERCE", "Data sovereignty", "Offline verification", "Flexo / ink‑jet compatible", "WCAG AA"];
  const dup = [...items, ...items];
  return (
    <div className="ticker" aria-hidden="true">
      <div className="track">
        {dup.map((x, i) => (
          <span key={i}>
            <span>{x}</span>
            <span className="sep" style={{ marginLeft: 56 }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————
// Section header (eyebrow + rule + title + lede)
// ——————————————————————————————————————————————
function SectionHead({ eyebrow, title, lede, id }) {
  const [ref, seen] = useInView();
  return (
    <header ref={ref} id={id} className={`sec-head${seen ? " in-view" : ""}`}>
      <div className="eyebrow">{eyebrow}</div>
      <div className="draw-rule"></div>
      {title ? <h2 className="section-title fade-up">{title}</h2> : null}
      {lede ? <p className="section-lede fade-up">{lede}</p> : null}
    </header>
  );
}

// ——————————————————————————————————————————————
// Problem
// ——————————————————————————————————————————————
function Problem({ t }) {
  const stats = t.problem.stats.filter((s) => !/\[STAT NEEDED\]/i.test(s.v));
  return (
    <section className="section" id="problem">
      <div className="container">
        <SectionHead eyebrow={t.problem.eyebrow} title={t.problem.title} lede={t.problem.lede} />
        {stats.length > 0 ? (
          <div className="stat-grid">
            {stats.map((s, i) => (
              <div className="stat" key={i}>
                <div className="v">{s.v}</div>
                <div className="l">{s.l}</div>
                <div className="s">{s.s}</div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="why-block">
          <h3>{t.problem.why_title}</h3>
          <p>{t.problem.why_body}</p>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// How it works — with architecture diagram
// ——————————————————————————————————————————————
function StepIcon({ kind }) {
  const stroke = "#14181f";
  const ochre = "#a85a2c";
  switch (kind) {
    case 1:
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="1.2">
          <rect x="6" y="8" width="28" height="24" />
          <line x1="10" y1="14" x2="22" y2="14" />
          <line x1="10" y1="18" x2="26" y2="18" />
          <line x1="10" y1="22" x2="20" y2="22" />
          <circle cx="28" cy="26" r="3" fill={ochre} stroke="none"/>
        </svg>
      );
    case 2:
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="1.2">
          <circle cx="20" cy="20" r="14" />
          <circle cx="20" cy="20" r="10" />
          <path d="M14 20 L18 24 L26 16" stroke={ochre} strokeWidth="1.6"/>
        </svg>
      );
    case 3:
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="1.2">
          <rect x="8" y="8" width="24" height="10"/>
          <rect x="6" y="18" width="28" height="12"/>
          <rect x="11" y="22" width="18" height="10" fill={ochre} stroke="none" opacity="0.18"/>
          <rect x="11" y="22" width="18" height="10"/>
          <line x1="14" y1="26" x2="20" y2="26"/>
          <line x1="14" y1="29" x2="22" y2="29"/>
        </svg>
      );
    case 4:
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="1.2">
          <rect x="9" y="6" width="22" height="28" rx="2"/>
          <rect x="13" y="11" width="14" height="14"/>
          <rect x="15" y="13" width="3" height="3" fill={stroke}/>
          <rect x="22" y="13" width="3" height="3" fill={stroke}/>
          <rect x="15" y="20" width="3" height="3" fill={stroke}/>
          <line x1="20" y1="29" x2="20" y2="31" stroke={ochre} strokeWidth="1.6"/>
        </svg>
      );
    default:
      return null;
  }
}

function ArchDiagram({ actors }) {
  return (
    <svg viewBox="0 0 800 280" role="img" aria-label="Architecture of trust">
      <defs>
        <marker id="arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L8,5 L0,10 z" fill="#14181f"/>
        </marker>
      </defs>
      {[
        { x: 100, label: actors[0].k, sub: actors[0].d },
        { x: 400, label: actors[1].k, sub: actors[1].d },
        { x: 700, label: actors[2].k, sub: actors[2].d },
      ].map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy="120" r="56" fill="#fbf5e7" stroke="#14181f" strokeWidth="1"/>
          <circle cx={n.x} cy="120" r="48" fill="none" stroke="#14181f" strokeWidth="0.5"/>
          {i === 1 ? <circle cx={n.x} cy="120" r="14" fill="#a85a2c"/> : null}
          {i !== 1 ? <circle cx={n.x} cy="120" r="14" fill="none" stroke="#14181f" strokeWidth="1"/> : null}
          <text x={n.x} y="220" textAnchor="middle" fontFamily="Playfair Display, Georgia, serif" fontSize="20" fontWeight="500" fill="#14181f">{n.label}</text>
          <text x={n.x} y="244" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10.5" letterSpacing="1.2" fill="#6c6655">{n.sub}</text>
        </g>
      ))}
      <g stroke="#14181f" strokeWidth="1" fill="none">
        <path d="M156,108 C220,80 320,80 344,108" markerEnd="url(#arr)"/>
        <path d="M456,108 C520,80 620,80 644,108" markerEnd="url(#arr)"/>
        <path d="M644,142 C580,180 480,180 456,148" markerEnd="url(#arr)"/>
        <path d="M344,142 C280,180 180,180 156,148" markerEnd="url(#arr)"/>
      </g>
      <g fontFamily="IBM Plex Mono, monospace" fontSize="9.5" letterSpacing="1.4" fill="#6c6655">
        <text x="250" y="68" textAnchor="middle">DEMANDE / REQUEST</text>
        <text x="550" y="68" textAnchor="middle">ÉMISSION / ISSUANCE</text>
        <text x="550" y="200" textAnchor="middle">SCAN</text>
        <text x="250" y="200" textAnchor="middle">SIGNALEMENT / REPORT</text>
      </g>
      <line x1="60" y1="40" x2="740" y2="40" stroke="#c9bfa8" strokeDasharray="3 3"/>
      <line x1="60" y1="260" x2="740" y2="260" stroke="#c9bfa8" strokeDasharray="3 3"/>
      <text x="60" y="32" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" letterSpacing="1.6" fill="#6c6655">REGISTRE SIGNÉ · SIGNED REGISTER</text>
    </svg>
  );
}

function HowItWorks({ t }) {
  return (
    <section className="section" id="how">
      <div className="container">
        <SectionHead eyebrow={t.how.eyebrow} title={t.how.title} />
        <div className="steps">
          {t.how.steps.map((s, i) => (
            <div className="step" key={i}>
              <div className="n">{s.n}</div>
              <div className="icon"><StepIcon kind={i + 1} /></div>
              <div className="t">{s.t}</div>
              <div className="d">{s.d}</div>
            </div>
          ))}
        </div>
        <div className="arch">
          <h3>{t.how.arch_title}</h3>
          <p className="arch-cap">{t.how.arch_caption}</p>
          <div className="stage">
            <ArchDiagram actors={t.how.arch_actors} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Government
// ——————————————————————————————————————————————
function DashboardMock({ lang }) {
  const dots = [
    { x: 22, y: 38, k: "ok" }, { x: 44, y: 52, k: "warn" }, { x: 67, y: 41, k: "ok" },
    { x: 80, y: 60, k: "err" }, { x: 33, y: 70, k: "warn" }, { x: 56, y: 30, k: "ok" },
    { x: 70, y: 76, k: "err" }, { x: 18, y: 64, k: "ok" },
  ];
  const rows = lang === "fr"
    ? [
        { id: "AVL‑8821‑D", t: "Eau minérale 1,5 L · Douala", k: "ok", s: "Authentique" },
        { id: "AVL‑8714‑Y", t: "Boisson gazeuse 33 cl · Yaoundé", k: "warn", s: "À vérifier" },
        { id: "AVL‑8493‑B", t: "Eau minérale 50 cl · Bafoussam", k: "err", s: "Suspect" },
        { id: "AVL‑8401‑D", t: "Eau minérale 1,5 L · Douala", k: "ok", s: "Authentique" },
      ]
    : [
        { id: "AVL‑8821‑D", t: "Mineral water 1.5 L · Douala", k: "ok", s: "Authentic" },
        { id: "AVL‑8714‑Y", t: "Soft drink 33 cl · Yaoundé", k: "warn", s: "Review" },
        { id: "AVL‑8493‑B", t: "Mineral water 50 cl · Bafoussam", k: "err", s: "Suspect" },
        { id: "AVL‑8401‑D", t: "Mineral water 1.5 L · Douala", k: "ok", s: "Authentic" },
      ];
  return (
    <div className="dash">
      <div className="preview-tag">[{lang === "fr" ? "Aperçu" : "Preview"}]</div>
      <div className="dash-bar">
        <span><b>MINCOMMERCE</b> · {lang === "fr" ? "Tableau d'application" : "Enforcement dashboard"}</span>
        <span>{lang === "fr" ? "Fenêtre 24 h" : "Window 24 h"}</span>
        <span>{lang === "fr" ? "Scans" : "Scans"} <b>14&nbsp;204</b></span>
        <span>{lang === "fr" ? "Signalements" : "Reports"} <b>38</b></span>
      </div>
      <div className="dash-grid">
        <div className="dash-map">
          <svg viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M6 0 H0 V6" stroke="rgba(244,237,224,0.06)" strokeWidth="0.3" fill="none"/>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100" height="64" fill="url(#grid)"/>
            <path d="M2,40 C8,32 18,38 24,30 C30,22 36,28 42,24 C50,18 58,28 64,22 C72,14 80,22 86,16 L100,18 L100,64 L0,64 Z" fill="rgba(168,90,44,0.07)" stroke="rgba(168,90,44,0.4)" strokeWidth="0.3"/>
            {dots.map((d, i) => {
              const c = d.k === "ok" ? "#7ec9a0" : d.k === "warn" ? "#a85a2c" : "#d77878";
              return (
                <g key={i}>
                  <circle cx={d.x} cy={d.y} r="0.7" fill={c}/>
                  <circle cx={d.x} cy={d.y} r="2.2" fill="none" stroke={c} strokeWidth="0.3" opacity="0.6">
                    <animate attributeName="r" from="0.7" to="3.5" dur="2.4s" begin={`${i * 0.3}s`} repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.7" to="0" dur="2.4s" begin={`${i * 0.3}s`} repeatCount="indefinite"/>
                  </circle>
                </g>
              );
            })}
            <text x="3" y="6" fontFamily="IBM Plex Mono, monospace" fontSize="2.4" letterSpacing="0.4" fill="rgba(244,237,224,0.5)">CMR · LITTORAL & CENTRE</text>
          </svg>
        </div>
        <div className="dash-side">
          {rows.map((r, i) => (
            <div className={`dash-row ${r.k}`} key={i}>
              <span className="id">{r.id}</span>
              <span>{r.t}</span>
              <span className="pill">{r.s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ForGov({ t, lang }) {
  return (
    <section className="section section--gov" id="gov">
      <div className="container">
        <SectionHead eyebrow={t.gov.eyebrow} title={t.gov.title} lede={t.gov.lede} />
        <div className="cards">
          {t.gov.cards.map((c, i) => (
            <div className="card" key={i}>
              <div className="num">0{i + 1}</div>
              <h4>{c.t}</h4>
              <p>{c.d}</p>
            </div>
          ))}
        </div>
        <DashboardMock lang={lang} />
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Manufacturers
// ——————————————————————————————————————————————
function ForInd({ t }) {
  return (
    <section className="section" id="ind">
      <div className="container">
        <SectionHead eyebrow={t.ind.eyebrow} title={t.ind.title} />
        <div className="cards">
          {t.ind.cards.map((c, i) => (
            <div className="card" key={i}>
              <div className="num">0{i + 1}</div>
              <h4>{c.t}</h4>
              <p>{c.d}</p>
            </div>
          ))}
        </div>
        <div className="pricing-row">
          <div>
            <div className="kicker">{t.ind.pricing_kicker}</div>
            <h3>{t.ind.pricing_title}</h3>
          </div>
          <p>{t.ind.pricing_body}</p>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Citizens — phone mocks
// ——————————————————————————————————————————————
function PhoneScan({ phone }) {
  const cells = Array.from({ length: 121 }, () => Math.random() > 0.5);
  return (
    <div className="phone">
      <div className="notch"></div>
      <div className="screen">
        <div className="topbar"><span>09:42</span><span>●●●</span></div>
        <div className="scan-target">
          <div className="frame">
            <div className="qr">{cells.map((c, i) => <i key={i} style={{ opacity: c ? 1 : 0 }}/>)}</div>
            <div className="laser"></div>
          </div>
        </div>
        <div className="label-pill">{phone.status}</div>
        <div className="caption">{phone.caption}</div>
      </div>
    </div>
  );
}

function PhoneResult({ phone, lang }) {
  return (
    <div className="phone">
      <div className="notch"></div>
      <div className="screen">
        <div className="topbar"><span>09:42</span><span>●●●</span></div>
        <div className="result">
          <div className="badge"><span>●</span>{phone.status}</div>
          <div className="check">
            <svg viewBox="0 0 42 42" fill="none" stroke="#2c6b3f" strokeWidth="3">
              <path d="M11 22 L18 29 L31 14"/>
            </svg>
          </div>
          <div className="product-title">Source du Pays</div>
          <div className="product-meta">EAU MINÉRALE · 1,5 L · LOT 0312</div>
          <div className="lines">
            <div className="row"><span>{lang === "fr" ? "Émis" : "Issued"}</span><span>12/03/2026</span></div>
            <div className="row"><span>{lang === "fr" ? "Régulateur" : "Regulator"}</span><span>MINCOMMERCE</span></div>
            <div className="row"><span>{lang === "fr" ? "Code" : "Code"}</span><span>AVL‑8821‑D</span></div>
          </div>
        </div>
        <div className="label-pill" style={{ marginTop: 14 }}>{phone.label}</div>
      </div>
    </div>
  );
}

function PhoneReport({ phone, lang }) {
  return (
    <div className="phone">
      <div className="notch"></div>
      <div className="screen">
        <div className="topbar"><span>09:42</span><span>●●●</span></div>
        <div className="result suspect" style={{ flex: "0 0 auto", marginBottom: 12 }}>
          <div className="badge"><span>●</span>{phone.status}</div>
        </div>
        <div className="report-form">
          <div className="field">{lang === "fr" ? "Code lu" : "Code read"} <b>AVL‑????</b></div>
          <div className="field">{lang === "fr" ? "Lieu (auto)" : "Location (auto)"} <b>4.0511°N · 9.7679°E</b></div>
          <div className="photo">{lang === "fr" ? "+ AJOUTER PHOTO" : "+ ADD PHOTO"}</div>
          <div className="field">{lang === "fr" ? "Anonyme par défaut" : "Anonymous by default"} <b>✓</b></div>
          <div className="send">{lang === "fr" ? "ENVOYER AU RÉGULATEUR" : "SEND TO REGULATOR"}</div>
        </div>
        <div className="label-pill" style={{ marginTop: 12 }}>{phone.label}</div>
      </div>
    </div>
  );
}

function ForCit({ t, lang }) {
  return (
    <section className="section section--cit" id="cit">
      <div className="container">
        <SectionHead eyebrow={t.cit.eyebrow} />
        <div className="cit-titles">
          <span>{t.cit.title_a}</span>
          <span>{t.cit.title_b}</span>
          <span>{t.cit.title_c}</span>
        </div>
        <div className="phone-row">
          <PhoneScan phone={t.cit.phones[0]} />
          <PhoneResult phone={t.cit.phones[1]} lang={lang} />
          <PhoneReport phone={t.cit.phones[2]} lang={lang} />
        </div>
        <div className="cit-foot">
          <p style={{ margin: 0 }}>{t.cit.sub}</p>
          <p style={{ margin: 0, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
            {lang === "fr" ? "Pas d'application — fonctionne dans le navigateur" : "No app — works in any browser"}
          </p>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Pilot
// ——————————————————————————————————————————————
function Pilot({ t }) {
  return (
    <section className="section" id="pilot">
      <div className="container">
        <SectionHead eyebrow={t.pilot.eyebrow} title={t.pilot.title} lede={t.pilot.lede} />
        <div className="pilot-grid">
          <div>
            <h3 className="pilot-h3">{t.pilot.partners_title}</h3>
            <div className="partner-list">
              {t.pilot.partners.map((p, i) => (
                <div className="partner" key={i}>
                  <div className="id">PA · 0{i + 1}</div>
                  <div className="name">{p}</div>
                  <div className="tag">LOI</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="pilot-h3">{t.pilot.kpi_title}</h3>
            <div className="kpi-list">
              {t.pilot.kpis.map((k, i) => (
                <div className="kpi" key={i}>
                  <span className="k">{k.k}</span>
                  <span className="v">{k.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// About
// ——————————————————————————————————————————————
function About({ t }) {
  return (
    <section className="section" id="about">
      <div className="container">
        <SectionHead eyebrow={t.about.eyebrow} title={t.about.title} />
        <div className="about-grid">
          <div className="founder">
            <div className="kicker">{t.about.founder_kicker}</div>
            {t.about.founder_name ? <div className="name">{t.about.founder_name}</div> : null}
            <p className="role">{t.about.founder_role}</p>
            <ul className="creds">
              {t.about.founder_creds.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
          <div>
            <div className="hiring">
              <span className="pill"><span></span>{t.about.hiring_status}</span>
              <h4>{t.about.hiring_role}</h4>
              <p>{t.about.hiring_body}</p>
            </div>
            <div className="sdg-block">
              <div className="title">{t.about.sdg_title}</div>
              <div className="sdg-grid">
                {t.about.sdg.map((s) => (
                  <div className="sdg" key={s.n}>
                    <div className="n">{s.n}</div>
                    <div className="t">{s.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Contact
// ——————————————————————————————————————————————
function Contact({ t }) {
  const [sent, setSent] = useState(false);
  return (
    <section className="section" id="contact">
      <div className="container">
        <SectionHead eyebrow={t.contact.eyebrow} title={t.contact.title} lede={t.contact.lede} />
        <div className="contact-grid">
          <div>
            <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: 24, lineHeight: 1.3, margin: 0, color: "var(--ink-2)" }}>
              {t.contact.lede}
            </p>
            <div style={{ marginTop: 24, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)", textTransform: "uppercase" }}>
              {t.contact.direct}
            </div>
            <a href={`mailto:${t.contact.email}`} style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: 22, color: "var(--ochre-2)", textDecoration: "none", display: "inline-block", marginTop: 6 }}>
              {t.contact.email}
            </a>
          </div>
          <form className="brief" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            {sent ? (
              <div className="sent">{t.contact.fields.sent}</div>
            ) : null}
            <label>{t.contact.fields.name}<input type="text" required /></label>
            <label>{t.contact.fields.org}<input type="text" required /></label>
            <label>{t.contact.fields.role}
              <select required defaultValue="">
                <option value="" disabled>—</option>
                {t.contact.role_options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label>{t.contact.fields.country}<input type="text" defaultValue="Cameroun" /></label>
            <label className="full">{t.contact.fields.message}<textarea /></label>
            <div className="full" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <button type="submit" className="btn">{t.contact.fields.submit}<span className="arrow">→</span></button>
              <span className="ph-tag">[mock submission]</span>
            </div>
            <div className="brief-direct">{t.contact.direct} · <b>{t.contact.email}</b></div>
          </form>
        </div>
      </div>
    </section>
  );
}

// ——————————————————————————————————————————————
// Footer
// ——————————————————————————————————————————————
function Footer({ t, lang, setLang }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="grid">
          <div>
            <p className="word">Aval</p>
            <p className="tagline">{t.footer.tagline}</p>
          </div>
          <div>
            <h5>{lang === "fr" ? "Sections" : "Sections"}</h5>
            <ul>
              <li><a href="#problem">{t.nav.problem}</a></li>
              <li><a href="#how">{t.nav.how}</a></li>
              <li><a href="#gov">{t.nav.gov}</a></li>
              <li><a href="#ind">{t.nav.ind}</a></li>
              <li><a href="#cit">{t.nav.cit}</a></li>
            </ul>
          </div>
          <div>
            <h5>{lang === "fr" ? "Légal" : "Legal"}</h5>
            <ul>
              <li><a href="#">{t.footer.legal_a}</a></li>
              <li><a href="#">{t.footer.legal_b}</a></li>
              <li><a href={`mailto:${t.contact.email}`}>{t.contact.email}</a></li>
            </ul>
          </div>
          <div>
            <h5>{t.footer.lang}</h5>
            <div className="lang-toggle" role="group" aria-label="Language">
              <button aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>FR</button>
              <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
            </div>
            <p style={{ marginTop: 18, fontSize: 12.5, opacity: 0.7, lineHeight: 1.5 }}>{t.footer.sdg_line}</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t.footer.copy}</span>
          <span>{t.footer.origin}</span>
        </div>
      </div>
    </footer>
  );
}

// ——————————————————————————————————————————————
// App
// ——————————————————————————————————————————————
export default function App() {
  const [lang, setLang] = useLang();
  const t = AVAL_I18N[lang];
  return (
    <div className="shell" data-screen-label="Aval landing page">
      <Header lang={lang} setLang={setLang} t={t} />
      <Hero t={t} lang={lang} />
      <Ticker lang={lang} />
      <Problem t={t} />
      <HowItWorks t={t} />
      <ForGov t={t} lang={lang} />
      <ForInd t={t} />
      <ForCit t={t} lang={lang} />
      <Pilot t={t} />
      <About t={t} />
      <Contact t={t} />
      <Footer t={t} lang={lang} setLang={setLang} />
    </div>
  );
}
