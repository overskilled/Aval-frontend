import { useEffect, useState } from "react";

function starPoints(cx, cy, r) {
  const inner = r * 0.4;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    pts.push(
      `${(cx + Math.cos(ang) * rad).toFixed(2)},${(cy + Math.sin(ang) * rad).toFixed(2)}`
    );
  }
  return pts.join(" ");
}

function PanelSeal({ outerText, innerText }) {
  return (
    <div className="auth-seal" aria-hidden="true">
      <svg className="ring-out" viewBox="0 0 200 200">
        <defs>
          <path
            id="auth-out"
            d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0"
            fill="none"
          />
        </defs>
        <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
        <text
          fontFamily="IBM Plex Mono, monospace"
          fontSize="6.4"
          letterSpacing="3"
          fill="currentColor"
        >
          <textPath href="#auth-out" startOffset="0">
            {outerText.repeat(3)}
          </textPath>
        </text>
      </svg>
      <svg className="ring-in" viewBox="0 0 200 200">
        <defs>
          <path
            id="auth-in"
            d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"
            fill="none"
          />
        </defs>
        <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
        <text
          fontFamily="IBM Plex Mono, monospace"
          fontSize="5"
          letterSpacing="2.4"
          fill="currentColor"
          opacity="0.65"
        >
          <textPath href="#auth-in" startOffset="0">
            {innerText.repeat(4)}
          </textPath>
        </text>
      </svg>
      <svg className="orbit-star" viewBox="0 0 200 200">
        <polygon
          points={starPoints(100, 14, 5)}
          fill="#fcd116"
          stroke="currentColor"
          strokeWidth="0.4"
        />
      </svg>
      <svg className="ticks" viewBox="0 0 200 200" stroke="currentColor" strokeWidth="0.6">
        <line x1="100" y1="0" x2="100" y2="6" />
        <line x1="100" y1="194" x2="100" y2="200" />
        <line x1="0" y1="100" x2="6" y2="100" />
        <line x1="194" y1="100" x2="200" y2="100" />
      </svg>
      <div className="auth-seal-core">
        <div>
          <div className="auth-seal-word">Aval</div>
          <div className="auth-seal-meta">SCEAU OFFICIEL</div>
        </div>
      </div>
    </div>
  );
}

export default function Panel({ lang, t, common }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");

  const outer =
    lang === "fr"
      ? "AVAL · LE SCEAU DU CONSOMMATEUR · DOUALA · OAPI · CEMAC · "
      : "AVAL · CONSUMER SEAL · DOUALA · OAPI · CEMAC · ";
  const inner =
    lang === "fr"
      ? "VÉRIFIÉ · APPROUVÉ · ENREGISTRÉ · "
      : "VERIFIED · APPROVED · RECORDED · ";

  return (
    <aside className="auth-panel">
      <div className="auth-panel-grain" aria-hidden="true" />
      <div className="auth-panel-top">
        <div className="auth-panel-eyebrow">
          <span className="dot">●</span> {common.panel_eyebrow}
        </div>
        <div className="auth-panel-clock">
          {hh}:{mm} · {lang === "fr" ? "Heure de Douala" : "Douala time"}
        </div>
      </div>

      <div className="auth-panel-stage">
        <PanelSeal outerText={outer} innerText={inner} />
      </div>

      <figure className="auth-panel-quote">
        <blockquote>“{common.panel_quote}”</blockquote>
        <figcaption>{common.panel_attrib}</figcaption>
      </figure>

      <div className="auth-panel-foot">
        <span>{common.panel_footer_a}</span>
        <span className="sep">◆</span>
        <span>{common.panel_footer_b}</span>
        <span className="sep">◆</span>
        <span>{common.panel_footer_c}</span>
      </div>
      <div className="auth-panel-flag" aria-hidden="true" />
    </aside>
  );
}
