import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../auth/api.js";
import "./verify.css";

const I18N = {
  fr: {
    brand: "Aval",
    langFr: "FR",
    langEn: "EN",
    loading: "Vérification du code…",
    pillAuthentic: "Authentique",
    pillSuspicious: "Suspect",
    pillUnknown: "Non reconnu",
    headlineAuthentic: "Produit authentique",
    headlineSuspicious: "Produit suspect — ne pas consommer",
    headlineUnknown: "Produit non reconnu",
    subAuthentic: "Le code a été émis par un industriel agréé et vérifié par l'État.",
    subSuspicious: "Ce code a été révoqué. Si vous avez ce produit en main, ne le consommez pas et signalez-le.",
    subUnknown: "Ce QR n'est pas reconnu. Il s'agit probablement d'une contrefaçon. Ne consommez pas le produit.",
    subMalformed: "Le code QR est mal formé. Réessayez en scannant à nouveau.",
    subInvalidSig: "La signature ne correspond pas. Code probablement contrefait.",
    rowManufacturer: "Industriel",
    rowBatch: "Lot",
    rowSerial: "N° de série",
    rowProduction: "Production",
    rowExpiry: "Expiration",
    rowVolume: "Volume",
    rowCategory: "Catégorie",
    rowStatus: "Statut",
    expired: "expiré",
    bannerExpired: "Attention — la date d'expiration de ce lot est dépassée.",
    bannerReportSuspicious: "Vous pouvez signaler ce produit aux autorités via les services d'application — fonction à venir.",
    footPoweredBy: "Aval — sceau de confiance du consommateur africain",
    footHelp: "Vous voulez en savoir plus ?",
    footHome: "Accueil",
    cats: {
      bottled_water: "Eau en bouteille",
      soft_drinks: "Boisson gazeuse",
    },
    pkg: {
      PET: "PET",
      glass: "Verre",
      aluminum: "Aluminium",
      carton: "Carton",
      other: "Autre",
    },
    noToken: "Aucun code à vérifier. Scannez un QR Aval pour commencer.",
  },
  en: {
    brand: "Aval",
    langFr: "FR",
    langEn: "EN",
    loading: "Verifying code…",
    pillAuthentic: "Authentic",
    pillSuspicious: "Suspect",
    pillUnknown: "Unknown",
    headlineAuthentic: "Authentic product",
    headlineSuspicious: "Suspect product — do not consume",
    headlineUnknown: "Unknown product",
    subAuthentic: "This code was issued by a licensed manufacturer and verified by the State.",
    subSuspicious: "This code has been revoked. If you have this product, do not consume it — report it.",
    subUnknown: "This QR isn't recognised. It's likely counterfeit. Do not consume the product.",
    subMalformed: "The QR code is malformed. Try scanning again.",
    subInvalidSig: "The signature doesn't match. Likely counterfeit.",
    rowManufacturer: "Manufacturer",
    rowBatch: "Batch",
    rowSerial: "Serial",
    rowProduction: "Produced",
    rowExpiry: "Expires",
    rowVolume: "Volume",
    rowCategory: "Category",
    rowStatus: "Status",
    expired: "expired",
    bannerExpired: "Warning — this batch's expiry date has passed.",
    bannerReportSuspicious: "You can report this product to the authorities via the enforcement service — coming soon.",
    footPoweredBy: "Aval — Africa's mark of consumer trust",
    footHelp: "Want to learn more?",
    footHome: "Home",
    cats: {
      bottled_water: "Bottled water",
      soft_drinks: "Soft drink",
    },
    pkg: {
      PET: "PET",
      glass: "Glass",
      aluminum: "Aluminum",
      carton: "Carton",
      other: "Other",
    },
    noToken: "No code to verify. Scan an Aval QR to start.",
  },
};

function MiniSeal() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="none" stroke="#14181f" strokeWidth="0.8" />
      <circle cx="20" cy="20" r="15" fill="none" stroke="#14181f" strokeWidth="0.6" />
      <circle cx="20" cy="20" r="8" fill="#14181f" />
      <polygon points="20,16 21.18,18.94 24.5,19.18 21.91,21.32 22.85,24.56 20,22.8 17.15,24.56 18.09,21.32 15.5,19.18 18.82,18.94" fill="#fcd116" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 22 L19 30 L33 14" />
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12 L36 34 L8 34 Z" />
      <line x1="22" y1="20" x2="22" y2="26" />
      <circle cx="22" cy="30" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
function UnknownIcon() {
  return (
    <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="22" cy="22" r="14" />
      <path d="M17 18 q5 -7 10 0 q-2 4 -5 5 v3" />
      <circle cx="22" cy="32" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function fmtDate(iso, lang) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB");
}

export default function Verify() {
  const [params] = useSearchParams();
  const token = params.get("t") || "";
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("aval.lang");
      if (saved === "fr" || saved === "en") return saved;
    } catch {}
    return navigator.language?.startsWith("en") ? "en" : "fr";
  });
  const t = I18N[lang];

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem("aval.lang", lang); } catch {}
  }, [lang]);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoading(true);
    setError("");
    api.verifyCode(token)
      .then((r) => { if (alive) setResult(r); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token]);

  const cardClass = useMemo(() => {
    if (!result) return "";
    if (result.status === "AUTHENTIC") return "is-authentic";
    if (result.status === "SUSPICIOUS") return "is-suspicious";
    return "is-unknown";
  }, [result]);

  return (
    <div className="vp">
      <div className="vp-shell">
        <header className="vp-head">
          <a href="/" className="vp-brand" aria-label="Aval">
            <MiniSeal />
            <span className="word">{t.brand}</span>
          </a>
          <div className="vp-lang" role="group" aria-label="Language">
            <button aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>{t.langFr}</button>
            <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>{t.langEn}</button>
          </div>
        </header>

        {!token ? (
          <div className="vp-card is-unknown">
            <p className="vp-sub" style={{ textAlign: "center", margin: 0 }}>{t.noToken}</p>
          </div>
        ) : loading ? (
          <div className="vp-card">
            <div className="vp-loading">
              <div className="vp-spinner" />
              <p>{t.loading}</p>
            </div>
          </div>
        ) : error ? (
          <div className="vp-card is-unknown">
            <div className="vp-icon-wrap"><UnknownIcon /></div>
            <div className="vp-headline-wrap">
              <h1 className="vp-headline">{t.headlineUnknown}</h1>
              <p className="vp-sub">{error}</p>
            </div>
          </div>
        ) : result ? (
          <ResultCard result={result} t={t} cardClass={cardClass} lang={lang} />
        ) : null}

        <footer className="vp-foot">
          {t.footPoweredBy}
        </footer>
      </div>
    </div>
  );
}

function ResultCard({ result, t, cardClass, lang }) {
  const subBy = {
    AUTHENTIC: t.subAuthentic,
    SUSPICIOUS: t.subSuspicious,
    UNKNOWN: result.reason === "malformed_token" ? t.subMalformed
      : result.reason === "invalid_signature" ? t.subInvalidSig
      : t.subUnknown,
  };
  const headlineBy = {
    AUTHENTIC: t.headlineAuthentic,
    SUSPICIOUS: t.headlineSuspicious,
    UNKNOWN: t.headlineUnknown,
  };
  const pillBy = {
    AUTHENTIC: t.pillAuthentic,
    SUSPICIOUS: t.pillSuspicious,
    UNKNOWN: t.pillUnknown,
  };
  const Icon = result.status === "AUTHENTIC" ? CheckIcon
    : result.status === "SUSPICIOUS" ? WarnIcon
    : UnknownIcon;

  const showProduct = !!result.product;
  const isExpired = result.batch?.isExpired;

  return (
    <div className={`vp-card ${cardClass}`}>
      <div className="vp-icon-wrap"><Icon /></div>
      <div className="vp-headline-wrap">
        <span className="vp-status-pill">
          <span className="dot" />
          {pillBy[result.status]}
        </span>
        <h1 className="vp-headline">{headlineBy[result.status]}</h1>
        <p className="vp-sub">{subBy[result.status]}</p>
      </div>

      {showProduct ? (
        <div className="vp-product">
          <h2 className="vp-product-name">{result.product.name}</h2>
          <p className="vp-product-meta">
            {t.cats[result.product.category] || result.product.category}
            {" · "}
            {result.product.volumeMl} mL
            {" · "}
            {t.pkg[result.product.packaging] || result.product.packaging}
          </p>
          <div className="vp-rows">
            <div className="vp-row">
              <span className="k">{t.rowManufacturer}</span>
              <span className="v">{result.manufacturer.name}</span>
            </div>
            <div className="vp-row">
              <span className="k">{t.rowBatch}</span>
              <span className="v id-mono">{result.batch.code}</span>
            </div>
            <div className="vp-row">
              <span className="k">{t.rowSerial}</span>
              <span className="v id-mono">{result.serial.identifiant}</span>
            </div>
            <div className="vp-row">
              <span className="k">{t.rowProduction}</span>
              <span className="v">{fmtDate(result.batch.productionDate, lang)}</span>
            </div>
            <div className="vp-row">
              <span className="k">{t.rowExpiry}</span>
              <span className="v">
                {fmtDate(result.batch.expiryDate, lang)}
                {isExpired ? <> {" "}<em style={{ color: "var(--vp-warn)" }}>({t.expired})</em></> : null}
              </span>
            </div>
          </div>
          {isExpired ? (
            <div className="vp-banner">{t.bannerExpired}</div>
          ) : null}
          {result.status === "SUSPICIOUS" ? (
            <div className="vp-banner err">{t.bannerReportSuspicious}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
